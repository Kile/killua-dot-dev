package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private DiscordTokenService discordTokenService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authorization code is required"));
        }

        try {
            Map<String, String> tokens = authService.processDiscordLogin(code);
            UserDto user = authService.getCurrentUser();
            return ResponseEntity.ok(Map.of(
                "token", tokens.get("jwt"), 
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String token = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(token);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        // In a stateless JWT system, logout is typically handled client-side
        // by removing the token from storage
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    @GetMapping("/discord-token")
    public ResponseEntity<?> getDiscordToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            return ResponseEntity.ok(Map.of(
                "discordToken", discordToken,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/discord-token/debug")
    public ResponseEntity<?> debugDiscordToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify the JWT token first
            UserDto user = authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            boolean hasToken = discordTokenService.hasDiscordToken(jwtToken);
            
            return ResponseEntity.ok(Map.of(
                "hasToken", hasToken,
                "discordToken", discordToken != null ? discordToken.substring(0, Math.min(50, discordToken.length())) + "..." : null,
                "discordTokenLength", discordToken != null ? discordToken.length() : 0,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/userinfo")
    public ResponseEntity<?> getUserInfo(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify the JWT token first
            authService.verifyToken(jwtToken);
            
            // Get the Discord token from the service
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Fetch user info from external API using the Discord token
            String userInfo = authService.fetchUserInfoFromExternalApi(discordToken);
            
            // Parse the JSON string and return it as a proper object
            Map<String, Object> userInfoMap = objectMapper.readValue(userInfo, Map.class);
            return ResponseEntity.ok(userInfoMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/admin/check")
    public ResponseEntity<?> checkAdminStatus(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            boolean isAdmin = authService.isAdmin(user.getDiscordId());
            
            return ResponseEntity.ok(Map.of(
                "isAdmin", isAdmin,
                "user", user
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/admin/user/{discordId}")
    public ResponseEntity<?> getAdminUserInfo(@RequestHeader("Authorization") String authHeader, @PathVariable String discordId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Fetch user info by Discord ID using the Discord token
            String userInfo = authService.fetchUserInfoFromExternalApiById(discordToken, discordId);
            
            // Parse the JSON string and return it as a proper object
            Map<String, Object> userInfoMap = objectMapper.readValue(userInfo, Map.class);
            return ResponseEntity.ok(userInfoMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
