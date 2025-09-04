package dev.killua.dashboard.service;

import dev.killua.dashboard.entity.DiscordToken;
import dev.killua.dashboard.repository.DiscordTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscordTokenServiceTest {

    @Mock
    private DiscordTokenRepository discordTokenRepository;

    @InjectMocks
    private DiscordTokenService discordTokenService;

    private DiscordToken validToken;
    private DiscordToken expiredToken;

    @BeforeEach
    void setUp() {
        // Create a valid token (not expired)
        validToken = new DiscordToken("jwt-token-123", "discord-token-456", "user-789");
        validToken.setExpiresAt(LocalDateTime.now().plusHours(1)); // Expires in 1 hour

        // Create an expired token
        expiredToken = new DiscordToken("jwt-token-expired", "discord-token-expired", "user-expired");
        expiredToken.setExpiresAt(LocalDateTime.now().minusHours(1)); // Expired 1 hour ago
    }

    @Test
    void testStoreDiscordToken_Success() {
        // Mock repository save
        when(discordTokenRepository.save(any(DiscordToken.class))).thenReturn(validToken);

        // Execute
        discordTokenService.storeDiscordToken("jwt-token-123", "discord-token-456", "user-789");

        // Verify
        verify(discordTokenRepository).save(any(DiscordToken.class));
    }

    @Test
    void testGetDiscordToken_ValidToken() {
        // Mock repository find
        when(discordTokenRepository.findByJwtToken("jwt-token-123")).thenReturn(Optional.of(validToken));

        // Execute
        String result = discordTokenService.getDiscordToken("jwt-token-123");

        // Verify
        assertEquals("discord-token-456", result);
    }

    @Test
    void testGetDiscordToken_ExpiredToken() {
        // Mock repository find with expired token
        when(discordTokenRepository.findByJwtToken("jwt-token-expired")).thenReturn(Optional.of(expiredToken));

        // Execute
        String result = discordTokenService.getDiscordToken("jwt-token-expired");

        // Verify
        assertNull(result);
    }

    @Test
    void testGetDiscordToken_TokenNotFound() {
        // Mock repository find with no token
        when(discordTokenRepository.findByJwtToken("nonexistent-token")).thenReturn(Optional.empty());

        // Execute
        String result = discordTokenService.getDiscordToken("nonexistent-token");

        // Verify
        assertNull(result);
    }

    @Test
    void testRemoveDiscordToken_Success() {
        // Mock repository delete
        doNothing().when(discordTokenRepository).deleteByJwtToken("jwt-token-123");

        // Execute
        discordTokenService.removeDiscordToken("jwt-token-123");

        // Verify
        verify(discordTokenRepository).deleteByJwtToken("jwt-token-123");
    }

    @Test
    void testHasDiscordToken_ValidToken() {
        // Mock repository find
        when(discordTokenRepository.findByJwtToken("jwt-token-123")).thenReturn(Optional.of(validToken));

        // Execute
        boolean result = discordTokenService.hasDiscordToken("jwt-token-123");

        // Verify
        assertTrue(result);
    }

    @Test
    void testHasDiscordToken_ExpiredToken() {
        // Mock repository find with expired token
        when(discordTokenRepository.findByJwtToken("jwt-token-expired")).thenReturn(Optional.of(expiredToken));

        // Execute
        boolean result = discordTokenService.hasDiscordToken("jwt-token-expired");

        // Verify
        assertFalse(result);
    }

    @Test
    void testHasDiscordToken_TokenNotFound() {
        // Mock repository find with no token
        when(discordTokenRepository.findByJwtToken("nonexistent-token")).thenReturn(Optional.empty());

        // Execute
        boolean result = discordTokenService.hasDiscordToken("nonexistent-token");

        // Verify
        assertFalse(result);
    }

    @Test
    void testGetDiscordTokenByDiscordId_ValidToken() {
        // Mock repository find
        when(discordTokenRepository.findByDiscordId("user-789")).thenReturn(Optional.of(validToken));

        // Execute
        String result = discordTokenService.getDiscordTokenByDiscordId("user-789");

        // Verify
        assertEquals("discord-token-456", result);
    }

    @Test
    void testGetDiscordTokenByDiscordId_ExpiredToken() {
        // Mock repository find with expired token
        when(discordTokenRepository.findByDiscordId("user-expired")).thenReturn(Optional.of(expiredToken));

        // Execute
        String result = discordTokenService.getDiscordTokenByDiscordId("user-expired");

        // Verify
        assertNull(result);
    }

    @Test
    void testGetDiscordTokenByDiscordId_TokenNotFound() {
        // Mock repository find with no token
        when(discordTokenRepository.findByDiscordId("nonexistent-user")).thenReturn(Optional.empty());

        // Execute
        String result = discordTokenService.getDiscordTokenByDiscordId("nonexistent-user");

        // Verify
        assertNull(result);
    }

    @Test
    void testCleanupExpiredTokens_Success() {
        // Mock repository delete
        doNothing().when(discordTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));

        // Execute
        discordTokenService.cleanupExpiredTokens();

        // Verify
        verify(discordTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));
    }

    @Test
    void testTokenExpirationEdgeCase_ExactlyExpired() {
        // Create a token that expires exactly now
        DiscordToken edgeCaseToken = new DiscordToken("jwt-edge", "discord-edge", "user-edge");
        edgeCaseToken.setExpiresAt(LocalDateTime.now());

        // Mock repository find
        when(discordTokenRepository.findByJwtToken("jwt-edge")).thenReturn(Optional.of(edgeCaseToken));

        // Execute
        String result = discordTokenService.getDiscordToken("jwt-edge");

        // Verify - should be considered expired
        assertNull(result);
    }

    @Test
    void testTokenExpirationEdgeCase_JustBeforeExpiration() {
        // Create a token that expires in a very short time
        DiscordToken edgeCaseToken = new DiscordToken("jwt-edge", "discord-edge", "user-edge");
        edgeCaseToken.setExpiresAt(LocalDateTime.now().plusSeconds(1)); // Expires in 1 second

        // Mock repository find
        when(discordTokenRepository.findByJwtToken("jwt-edge")).thenReturn(Optional.of(edgeCaseToken));

        // Execute
        String result = discordTokenService.getDiscordToken("jwt-edge");

        // Verify - should still be valid
        assertEquals("discord-edge", result);
    }

    @Test
    void testStoreDiscordTokenWithNullValues() {
        // Test storing token with null values (should not throw exception)
        assertDoesNotThrow(() -> {
            discordTokenService.storeDiscordToken(null, null, null);
        });

        // Verify repository was called
        verify(discordTokenRepository).save(any(DiscordToken.class));
    }

    @Test
    void testGetDiscordTokenWithNullJwtToken() {
        // Test getting token with null JWT token
        String result = discordTokenService.getDiscordToken(null);

        // Verify
        assertNull(result);
    }

    @Test
    void testHasDiscordTokenWithNullJwtToken() {
        // Test checking token with null JWT token
        boolean result = discordTokenService.hasDiscordToken(null);

        // Verify
        assertFalse(result);
    }

    @Test
    void testGetDiscordTokenByDiscordIdWithNullDiscordId() {
        // Test getting token with null Discord ID
        String result = discordTokenService.getDiscordTokenByDiscordId(null);

        // Verify
        assertNull(result);
    }
}
