package dev.killua.dashboard.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CdnTokenServiceTest {

    @InjectMocks
    private CdnTokenService cdnTokenService;

    @BeforeEach
    void setUp() {
        // Set the secret to match the Python test
        ReflectionTestUtils.setField(cdnTokenService, "apiSecret", "test-secret");
    }

    @Test
    void testGenerateFileSpecificTokenWithDuration() {
        // Test with known values that should match Python implementation
        String filePath = "test/image.png";
        long expiresInSeconds = 3600; // 1 hour
        
        String token = cdnTokenService.generateFileSpecificTokenWithDuration(filePath, expiresInSeconds);
        
        // Token should not be null or empty
        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        // Token should be 64 characters (SHA-256 hex string)
        assertEquals(64, token.length());
        
        // Token should only contain hex characters
        assertTrue(token.matches("^[0-9a-f]{64}$"));
    }

    @Test
    void testGenerateTokenConsistency() {
        // Test that same inputs produce same tokens
        String filePath = "test/file.txt";
        long expiresInSeconds = 1800; // 30 minutes
        
        String token1 = cdnTokenService.generateFileSpecificTokenWithDuration(filePath, expiresInSeconds);
        String token2 = cdnTokenService.generateFileSpecificTokenWithDuration(filePath, expiresInSeconds);
        
        assertEquals(token1, token2, "Same inputs should produce same tokens");
    }

    @Test
    void testDifferentPathsProduceDifferentTokens() {
        long expiresInSeconds = 3600;
        
        String token1 = cdnTokenService.generateFileSpecificTokenWithDuration("path1/file.txt", expiresInSeconds);
        String token2 = cdnTokenService.generateFileSpecificTokenWithDuration("path2/file.txt", expiresInSeconds);
        
        assertNotEquals(token1, token2, "Different paths should produce different tokens");
    }

    @Test
    void testDifferentDurationsProduceDifferentTokens() {
        String filePath = "test/file.txt";
        
        String token1 = cdnTokenService.generateFileSpecificTokenWithDuration(filePath, 1800); // 30 min
        String token2 = cdnTokenService.generateFileSpecificTokenWithDuration(filePath, 3600); // 1 hour
        
        assertNotEquals(token1, token2, "Different durations should produce different tokens");
    }

    @Test
    void testGetCdnToken() {
        String token = cdnTokenService.getCdnToken();
        
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertEquals(64, token.length());
        assertTrue(token.matches("^[0-9a-f]{64}$"));
    }

    @Test
    void testGetCurrentExpiry() {
        long expiry = cdnTokenService.getCurrentExpiry();
        
        // Should be 0 initially (no cached token)
        assertEquals(0, expiry);
        
        // After getting a token, expiry should be set
        cdnTokenService.getCdnToken();
        long newExpiry = cdnTokenService.getCurrentExpiry();
        
        assertTrue(newExpiry > 0);
        assertTrue(newExpiry > Instant.now().getEpochSecond());
    }

    @Test
    void testTokenFormat() {
        // Test that tokens follow the expected SHA-256 hex format
        String token = cdnTokenService.generateFileSpecificTokenWithDuration("test/file.png", 3600);
        
        // Should be exactly 64 hex characters
        assertTrue(token.matches("^[0-9a-f]{64}$"), 
            "Token should be 64 hex characters, got: " + token + " (length: " + token.length() + ")");
    }
}
