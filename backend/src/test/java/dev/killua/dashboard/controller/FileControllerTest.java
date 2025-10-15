package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.CdnTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private CdnTokenService cdnTokenService;

    @InjectMocks
    private FileController fileController;

    private UserDto testUser;
    private static final String TEST_JWT = "test-jwt-token";
    private static final String TEST_AUTH_HEADER = "Bearer " + TEST_JWT;

    @BeforeEach
    void setUp() {
        testUser = new UserDto();
        testUser.setDiscordId("123456789");
        
        // Set the external API base URL
        ReflectionTestUtils.setField(fileController, "externalApiBaseUrl", "https://api.killua.dev");
    }

    @Test
    void testGenerateFileLink_Success() throws Exception {
        // Arrange
        String filePath = "test/image.png";
        long expiryTimestamp = Instant.now().getEpochSecond() + 3600; // 1 hour from now
        String expectedToken = "test-token-123";
        
        when(authService.verifyToken(TEST_JWT)).thenReturn(testUser);
        when(authService.isAdmin(testUser.getDiscordId())).thenReturn(true);
        when(cdnTokenService.generateFileSpecificTokenWithDuration(eq("cdn/test/image.png"), any(Long.class)))
            .thenReturn(expectedToken);

        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            TEST_AUTH_HEADER, 
            filePath, 
            expiryTimestamp
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        // Verify the response contains expected fields
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        
        assertTrue(responseBody.containsKey("url"));
        assertTrue(responseBody.containsKey("token"));
        assertTrue(responseBody.containsKey("expiry"));
        
        String url = (String) responseBody.get("url");
        assertTrue(url.contains("https://api.killua.dev/image/cdn/"));
        assertTrue(url.contains(filePath));
        assertTrue(url.contains("token=" + expectedToken));
        assertTrue(url.contains("expiry=" + expiryTimestamp));
    }

    @Test
    void testGenerateFileLink_InvalidAuthHeader() throws Exception {
        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            "InvalidHeader", 
            "test/file.png", 
            Instant.now().getEpochSecond() + 3600
        );

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Invalid authorization header", responseBody.get("error"));
    }

    @Test
    void testGenerateFileLink_NotAdmin() throws Exception {
        // Arrange
        when(authService.verifyToken(TEST_JWT)).thenReturn(testUser);
        when(authService.isAdmin(testUser.getDiscordId())).thenReturn(false);

        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            TEST_AUTH_HEADER, 
            "test/file.png", 
            Instant.now().getEpochSecond() + 3600
        );

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Access denied. Admin privileges required.", responseBody.get("error"));
    }

    @Test
    void testGenerateFileLink_ExpiryInPast() throws Exception {
        // Arrange
        when(authService.verifyToken(TEST_JWT)).thenReturn(testUser);
        when(authService.isAdmin(testUser.getDiscordId())).thenReturn(true);

        long pastExpiry = Instant.now().getEpochSecond() - 3600; // 1 hour ago

        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            TEST_AUTH_HEADER, 
            "test/file.png", 
            pastExpiry
        );

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Expiry time must be in the future", responseBody.get("error"));
    }

    @Test
    void testGenerateFileLink_ExpiryNow() throws Exception {
        // Arrange
        when(authService.verifyToken(TEST_JWT)).thenReturn(testUser);
        when(authService.isAdmin(testUser.getDiscordId())).thenReturn(true);

        long currentExpiry = Instant.now().getEpochSecond(); // Now

        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            TEST_AUTH_HEADER, 
            "test/file.png", 
            currentExpiry
        );

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        assertEquals("Expiry time must be in the future", responseBody.get("error"));
    }

    @Test
    void testGenerateFileLink_PathNormalization() throws Exception {
        // Arrange
        String filePath = "image/test/file.png";
        long expiryTimestamp = Instant.now().getEpochSecond() + 3600; // 1 hour from now
        String expectedToken = "test-token-456";
        
        when(authService.verifyToken(TEST_JWT)).thenReturn(testUser);
        when(authService.isAdmin(testUser.getDiscordId())).thenReturn(true);
        when(cdnTokenService.generateFileSpecificTokenWithDuration(eq("cdn/test/file.png"), any(Long.class)))
            .thenReturn(expectedToken);

        // Act
        ResponseEntity<?> response = fileController.generateFileLink(
            TEST_AUTH_HEADER, 
            filePath, 
            expiryTimestamp
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        // Verify the response contains expected fields
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> responseBody = (java.util.Map<String, Object>) response.getBody();
        assertNotNull(responseBody);
        
        assertTrue(responseBody.containsKey("url"));
        assertTrue(responseBody.containsKey("token"));
        assertTrue(responseBody.containsKey("expiry"));
        
        String url = (String) responseBody.get("url");
        assertTrue(url.contains("https://api.killua.dev/image/cdn/"));
        assertTrue(url.contains("image/test/file.png")); // Original path should be preserved in URL
        assertTrue(url.contains("token=" + expectedToken));
        assertTrue(url.contains("expiry=" + expiryTimestamp));
    }
}
