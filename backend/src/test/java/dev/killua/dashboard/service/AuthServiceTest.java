package dev.killua.dashboard.service;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.entity.User;
import dev.killua.dashboard.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private DiscordTokenService discordTokenService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UserDto testUserDto;

    @BeforeEach
    void setUp() {
        // Set up test data
        testUser = new User("123456789", "testuser", "1234", "avatar.png");
        testUser.setEmail("test@example.com");
        testUser.setBanner("banner.png");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setLastLogin(LocalDateTime.now());
        testUser.setPremium(true);
        testUser.setPremiumTier("1");
        testUser.setPremiumExpires(LocalDateTime.now().plusDays(30));

        testUserDto = new UserDto();
        testUserDto.setDiscordId("123456789");
        testUserDto.setUsername("testuser");
        testUserDto.setDiscriminator("1234");
        testUserDto.setAvatar("avatar.png");
        testUserDto.setEmail("test@example.com");
        testUserDto.setBanner("banner.png");

        // Set required properties
        ReflectionTestUtils.setField(authService, "clientId", "test-client-id");
        ReflectionTestUtils.setField(authService, "clientSecret", "test-client-secret");
        ReflectionTestUtils.setField(authService, "redirectUri", "http://localhost:8080/auth/callback");
        ReflectionTestUtils.setField(authService, "externalApiBaseUrl", "http://api.example.com");
        ReflectionTestUtils.setField(authService, "adminDiscordIdsString", "123456789,987654321");
        ReflectionTestUtils.setField(authService, "restTemplate", restTemplate);
    }

    @Test
    void testProcessDiscordLogin_Success() throws Exception {
        // Mock Discord token response
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "discord-access-token");
        ResponseEntity<Map> tokenResponseEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);

        // Mock Discord user info response
        Map<String, Object> userInfoResponse = new HashMap<>();
        userInfoResponse.put("id", "123456789");
        userInfoResponse.put("username", "testuser");
        userInfoResponse.put("discriminator", "1234");
        userInfoResponse.put("avatar", "avatar.png");
        userInfoResponse.put("email", "test@example.com");
        ResponseEntity<Map> userInfoResponseEntity = new ResponseEntity<>(userInfoResponse, HttpStatus.OK);

        // Mock repository and service calls
        when(userRepository.findByDiscordId("123456789")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        
        // Mock loadUserByUsername to return a valid UserDetails
        when(userRepository.findByDiscordId("123456789")).thenReturn(Optional.of(testUser));

        // Mock RestTemplate calls
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(tokenResponseEntity);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(userInfoResponseEntity);

        // Execute
        Map<String, String> result = authService.processDiscordLogin("auth-code");

        // Verify
        assertNotNull(result);
        assertEquals("jwt-token", result.get("jwt"));
        verify(discordTokenService).storeDiscordToken("jwt-token", "discord-access-token", "123456789");
    }

    @Test
    void testProcessDiscordLogin_TokenExchangeFailure() {
        // Mock failed token response
        ResponseEntity<Map> failedResponse = new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(failedResponse);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.processDiscordLogin("invalid-code"));
    }

    @Test
    void testProcessDiscordLogin_NoAccessToken() {
        // Mock response without access token
        Map<String, Object> tokenResponse = new HashMap<>();
        ResponseEntity<Map> tokenResponseEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(tokenResponseEntity);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.processDiscordLogin("auth-code"));
    }

    @Test
    void testProcessDiscordLogin_UserInfoFailure() {
        // Mock successful token response
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "discord-access-token");
        ResponseEntity<Map> tokenResponseEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);

        // Mock failed user info response
        ResponseEntity<Map> failedUserInfoResponse = new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(tokenResponseEntity);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(failedUserInfoResponse);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.processDiscordLogin("auth-code"));
    }

    @Test
    void testGetCurrentUser_Success() {
        // Set current user
        ReflectionTestUtils.setField(authService, "currentUser", testUser);

        // Execute
        UserDto result = authService.getCurrentUser();

        // Verify
        assertNotNull(result);
        assertEquals("123456789", result.getDiscordId());
        assertEquals("testuser", result.getUsername());
        assertEquals("1234", result.getDiscriminator());
        assertEquals("avatar.png", result.getAvatar());
        assertEquals("test@example.com", result.getEmail());
        assertEquals("banner.png", result.getBanner());
        assertTrue(result.isPremium());
        assertEquals("1", result.getPremiumTier());
    }

    @Test
    void testGetCurrentUser_NoUserLoggedIn() {
        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.getCurrentUser());
    }

    @Test
    void testVerifyToken_Success() throws Exception {
        // Mock JWT service and repository
        when(jwtService.extractUsername("valid-token")).thenReturn("123456789");
        when(userRepository.findByDiscordId("123456789")).thenReturn(Optional.of(testUser));

        // Execute
        UserDto result = authService.verifyToken("valid-token");

        // Verify
        assertNotNull(result);
        assertEquals("123456789", result.getDiscordId());
        assertEquals("testuser", result.getUsername());
    }

    @Test
    void testVerifyToken_UserNotFound() {
        // Mock JWT service
        when(jwtService.extractUsername("valid-token")).thenReturn("123456789");
        when(userRepository.findByDiscordId("123456789")).thenReturn(Optional.empty());

        // Execute and verify
        assertThrows(Exception.class, () -> authService.verifyToken("valid-token"));
    }

    @Test
    void testLoadUserByUsername_Success() {
        // Mock repository
        when(userRepository.findByDiscordId("123456789")).thenReturn(Optional.of(testUser));

        // Execute
        UserDetails result = authService.loadUserByUsername("123456789");

        // Verify
        assertNotNull(result);
        assertEquals("123456789", result.getUsername());
        assertEquals("", result.getPassword());
        assertTrue(result.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("USER")));
    }

    @Test
    void testLoadUserByUsername_UserNotFound() {
        // Mock repository
        when(userRepository.findByDiscordId("nonexistent")).thenReturn(Optional.empty());

        // Execute and verify
        assertThrows(UsernameNotFoundException.class, () -> authService.loadUserByUsername("nonexistent"));
    }

    @Test
    void testFetchUserInfoFromExternalApi_Success() throws Exception {
        // Mock RestTemplate response
        ResponseEntity<String> response = new ResponseEntity<>("{\"user\":\"info\"}", HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(response);

        // Execute
        String result = authService.fetchUserInfoFromExternalApi("discord-token");

        // Verify
        assertEquals("{\"user\":\"info\"}", result);
    }

    @Test
    void testFetchUserInfoFromExternalApi_NonOkResponse() {
        // Mock RestTemplate response
        ResponseEntity<String> response = new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(response);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.fetchUserInfoFromExternalApi("discord-token"));
    }

    @Test
    void testFetchUserInfoFromExternalApi_EmptyResponse() {
        // Mock RestTemplate response
        ResponseEntity<String> response = new ResponseEntity<>(null, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(response);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.fetchUserInfoFromExternalApi("discord-token"));
    }

    @Test
    void testFetchUserInfoFromExternalApiById_Success() throws Exception {
        // Mock RestTemplate response
        ResponseEntity<String> response = new ResponseEntity<>("{\"user\":\"info\"}", HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(response);

        // Execute
        String result = authService.fetchUserInfoFromExternalApiById("discord-token", "123456789");

        // Verify
        assertEquals("{\"user\":\"info\"}", result);
    }

    @Test
    void testFetchUserInfoFromExternalApiById_NonOkResponse() {
        // Mock RestTemplate response
        ResponseEntity<String> response = new ResponseEntity<>("Error message", HttpStatus.UNAUTHORIZED);
        when(restTemplate.exchange(anyString(), eq(org.springframework.http.HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(response);

        // Execute and verify
        assertThrows(RuntimeException.class, () -> authService.fetchUserInfoFromExternalApiById("discord-token", "123456789"));
    }

    @Test
    void testIsAdmin_True() {
        // Initialize admin list first
        authService.init();
        
        // Test with admin Discord ID
        assertTrue(authService.isAdmin("123456789"));
    }

    @Test
    void testIsAdmin_False() {
        // Initialize admin list first
        authService.init();
        
        // Test with non-admin Discord ID
        assertFalse(authService.isAdmin("999999999"));
    }

    @Test
    void testInit() {
        // This test verifies that the @PostConstruct method works correctly
        // The adminDiscordIds should be initialized from the string
        authService.init();
        
        // Verify admin check works
        assertTrue(authService.isAdmin("123456789"));
        assertTrue(authService.isAdmin("987654321"));
        assertFalse(authService.isAdmin("555555555"));
    }
}
