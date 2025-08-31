package dev.killua.dashboard.service;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.entity.User;
import dev.killua.dashboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Arrays;
import jakarta.annotation.PostConstruct;

@Service
public class AuthService implements UserDetailsService {

        @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private DiscordTokenService discordTokenService;

    @Value("${spring.security.oauth2.client.registration.discord.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.discord.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.discord.redirect-uri}")
    private String redirectUri;

    @Value("${external.api.base-url}")
    private String externalApiBaseUrl;

    @Value("${admin.discord-ids}")
    private String adminDiscordIdsString;
    
    private List<String> adminDiscordIds;

    private final RestTemplate restTemplate = new RestTemplate();

    private User currentUser = null;
    
    @PostConstruct
    public void init() {
        // Initialize admin list from comma-separated string
        adminDiscordIds = Arrays.asList(adminDiscordIdsString.split(","));
    }

    public Map<String, String> processDiscordLogin(String code) throws Exception {
        try {
            // Exchange authorization code for access token
            String tokenUrl = "https://discord.com/api/oauth2/token";
            
            // Create the request body for token exchange
            String requestBody = String.format(
                "client_id=%s&client_secret=%s&grant_type=authorization_code&code=%s&redirect_uri=%s",
                clientId, clientSecret, code, redirectUri
            );
            
            // Make the token exchange request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Failed to exchange authorization code for access token");
            }
            
            Map<String, Object> tokenResponse = response.getBody();
            String accessToken = (String) tokenResponse.get("access_token");
            
            if (accessToken == null) {
                throw new RuntimeException("No access token received from Discord");
            }
            
            // Get user info from Discord using the access token
            UserDto userDto = getDiscordUserInfo(accessToken);
            
            // Save or update user in database
            User user = saveOrUpdateUser(userDto);
            currentUser = user;
            
            // Generate JWT token
            String jwtToken = jwtService.generateToken(loadUserByUsername(user.getDiscordId()));
            
            // Store Discord token server-side
            discordTokenService.storeDiscordToken(jwtToken, accessToken, user.getDiscordId());
            
            // Return only JWT token (Discord token stored server-side)
            Map<String, String> tokens = new HashMap<>();
            tokens.put("jwt", jwtToken);
            return tokens;
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to authenticate with Discord: " + e.getMessage());
        }
    }

    public UserDto getCurrentUser() {
        if (currentUser == null) {
            throw new RuntimeException("No user is currently logged in");
        }
        return convertToDto(currentUser);
    }

    private UserDto convertToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setDiscordId(user.getDiscordId());
        userDto.setUsername(user.getUsername());
        userDto.setDiscriminator(user.getDiscriminator());
        userDto.setAvatar(user.getAvatar());
        userDto.setEmail(user.getEmail());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setLastLogin(user.getLastLogin());
        userDto.setPremium(user.isPremium());
        userDto.setPremiumTier(user.getPremiumTier());
        userDto.setPremiumExpires(user.getPremiumExpires());
        return userDto;
    }

    private UserDto getDiscordUserInfo(String accessToken) {
        try {
            // Call Discord's user API to get user information
            String userInfoUrl = "https://discord.com/api/users/@me";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                userInfoUrl, 
                HttpMethod.GET, 
                request, 
                Map.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Failed to fetch user info from Discord");
            }
            
            Map<String, Object> userData = response.getBody();
            
            UserDto userDto = new UserDto();
            userDto.setDiscordId((String) userData.get("id"));
            userDto.setUsername((String) userData.get("username"));
            userDto.setDiscriminator((String) userData.get("discriminator"));
            userDto.setAvatar((String) userData.get("avatar"));
            userDto.setEmail((String) userData.get("email"));
            
            return userDto;
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch user info from Discord: " + e.getMessage());
        }
    }

    private User saveOrUpdateUser(UserDto userDto) {
        User user = userRepository.findByDiscordId(userDto.getDiscordId())
                .orElse(new User(userDto.getDiscordId(), userDto.getUsername(), 
                        userDto.getDiscriminator(), userDto.getAvatar()));
        
        user.setUsername(userDto.getUsername());
        user.setDiscriminator(userDto.getDiscriminator());
        user.setAvatar(userDto.getAvatar());
        user.setEmail(userDto.getEmail());
        user.setLastLogin(LocalDateTime.now());
        
        return userRepository.save(user);
    }

    public UserDto verifyToken(String token) throws Exception {
        String username = jwtService.extractUsername(token);
        User user = userRepository.findByDiscordId(username)
                .orElseThrow(() -> new Exception("User not found"));

        UserDto userDto = new UserDto();
        userDto.setDiscordId(user.getDiscordId());
        userDto.setUsername(user.getUsername());
        userDto.setDiscriminator(user.getDiscriminator());
        userDto.setAvatar(user.getAvatar());
        userDto.setEmail(user.getEmail());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setLastLogin(user.getLastLogin());
        userDto.setPremium(user.isPremium());
        userDto.setPremiumTier(user.getPremiumTier());
        userDto.setPremiumExpires(user.getPremiumExpires());

        return userDto;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByDiscordId(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getDiscordId())
                .password("") // No password for Discord OAuth
                .authorities("USER")
                .build();
    }

    public String fetchUserInfoFromExternalApi(String discordToken) throws Exception {
        try {
            String apiUrl = externalApiBaseUrl + "/userinfo";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                String.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to fetch user info from external API: " + response.getStatusCode());
            }
            
            if (response.getBody() == null) {
                throw new RuntimeException("Empty response from external API");
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch user info from external API: " + e.getMessage());
        }
    }
    
    public String fetchUserInfoByDiscordIdWithToken(String discordToken, String discordId) throws Exception {
        try {
            String apiUrl = externalApiBaseUrl + "/userinfo/" + discordId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                String.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to fetch user info from external API with error code " + response.getStatusCode() + ": " + response.getBody());
            }
            
            if (response.getBody() == null) {
                throw new RuntimeException("Empty response from external API");
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch user info from external API: " + e.getMessage());
        }
    }
    
    public boolean isAdmin(String discordId) {
        return adminDiscordIds.contains(discordId);
    }
}
