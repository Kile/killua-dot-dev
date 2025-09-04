package dev.killua.dashboard.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    private UserDetails userDetails;
    private String validSecretKey = "ZmFrZV9zZWNyZXRfa2V5X2Zvcl90ZXN0aW5nX3B1cnBvc2VzX29ubHlfZG9udF91c2VfaW5fcHJvZHVjdGlvbg=="; // base64 encoded fake secret

    @BeforeEach
    void setUp() {
        userDetails = User.builder()
                .username("testuser")
                .password("password")
                .authorities("USER")
                .build();

        ReflectionTestUtils.setField(jwtService, "secretKey", validSecretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L); // 24 hours
    }

    @Test
    void testExtractUsername_Success() {
        // Generate a token first
        String token = jwtService.generateToken(userDetails);

        // Extract username
        String username = jwtService.extractUsername(token);

        // Verify
        assertEquals("testuser", username);
    }

    @Test
    void testExtractClaim_Success() {
        // Generate a token first
        String token = jwtService.generateToken(userDetails);

        // Extract claim
        String username = jwtService.extractClaim(token, Claims::getSubject);

        // Verify
        assertEquals("testuser", username);
    }

    @Test
    void testGenerateToken_UserDetailsOnly() {
        // Generate token
        String token = jwtService.generateToken(userDetails);

        // Verify
        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        // Verify we can extract the username from the token
        String extractedUsername = jwtService.extractUsername(token);
        assertEquals("testuser", extractedUsername);
    }

    @Test
    void testGenerateToken_WithExtraClaims() {
        // Create extra claims
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "admin");
        extraClaims.put("userId", "123");

        // Generate token
        String token = jwtService.generateToken(extraClaims, userDetails);

        // Verify
        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        // Verify we can extract the username from the token
        String extractedUsername = jwtService.extractUsername(token);
        assertEquals("testuser", extractedUsername);
    }

    @Test
    void testIsTokenValid_ValidToken() {
        // Generate a valid token
        String token = jwtService.generateToken(userDetails);

        // Check if token is valid
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        // Verify
        assertTrue(isValid);
    }

    @Test
    void testIsTokenValid_InvalidUsername() {
        // Generate a token for one user
        String token = jwtService.generateToken(userDetails);

        // Create a different user
        UserDetails differentUser = User.builder()
                .username("differentuser")
                .password("password")
                .authorities("USER")
                .build();

        // Check if token is valid for different user
        boolean isValid = jwtService.isTokenValid(token, differentUser);

        // Verify
        assertFalse(isValid);
    }

    @Test
    void testIsTokenValid_ExpiredToken() {
        // Set a very short expiration time
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 1L); // 1 millisecond

        // Generate a token that will expire immediately
        String token = jwtService.generateToken(userDetails);

        // Wait a bit for token to expire
        try {
            Thread.sleep(100); // Wait 100ms to ensure expiration
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Check if token is valid - should throw exception for expired token
        assertThrows(Exception.class, () -> jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void testTokenExpiration() {
        // Generate a token
        String token = jwtService.generateToken(userDetails);

        // Extract expiration
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);

        // Verify
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));
    }

    @Test
    void testTokenIssuedAt() {
        // Generate a token
        String token = jwtService.generateToken(userDetails);

        // Extract issued at
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);

        // Verify
        assertNotNull(issuedAt);
        assertTrue(issuedAt.before(new Date()) || issuedAt.equals(new Date()));
    }

    @Test
    void testTokenWithCustomExpiration() {
        // Set custom expiration
        long customExpiration = 3600000L; // 1 hour
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", customExpiration);

        // Generate token
        String token = jwtService.generateToken(userDetails);

        // Extract expiration
        Date expiration = jwtService.extractClaim(token, Claims::getExpiration);
        Date issuedAt = jwtService.extractClaim(token, Claims::getIssuedAt);

        // Verify expiration is set correctly
        long expectedExpirationTime = issuedAt.getTime() + customExpiration;
        assertEquals(expectedExpirationTime, expiration.getTime(), 1000); // Allow 1 second tolerance
    }

    @Test
    void testTokenStructure() {
        // Generate a token
        String token = jwtService.generateToken(userDetails);

        // Verify token structure (should have 3 parts separated by dots)
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "JWT token should have 3 parts: header.payload.signature");
    }

    @Test
    void testExtractAllClaims() {
        // Generate a token
        String token = jwtService.generateToken(userDetails);

        // Extract all claims
        Claims claims = jwtService.extractClaim(token, claims1 -> claims1);

        // Verify basic claims
        assertEquals("testuser", claims.getSubject());
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void testTokenWithEmptyExtraClaims() {
        // Generate token with empty extra claims
        Map<String, Object> emptyClaims = new HashMap<>();
        String token = jwtService.generateToken(emptyClaims, userDetails);

        // Verify token is still valid
        assertTrue(jwtService.isTokenValid(token, userDetails));
        assertEquals("testuser", jwtService.extractUsername(token));
    }

    @Test
    void testTokenWithNullExtraClaims() {
        // Generate token with null extra claims - should throw exception
        assertThrows(IllegalArgumentException.class, () -> {
            jwtService.generateToken(null, userDetails);
        });
    }
}
