package dev.killua.dashboard.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class CdnTokenService {

    @Value("${external.api.secret}")
    private String apiSecret;

    private final AtomicReference<String> cachedToken = new AtomicReference<>();
    private final AtomicReference<Long> tokenExpiry = new AtomicReference<>();

    public String getCdnToken() {
        long currentTime = Instant.now().getEpochSecond();
        Long cachedExpiry = tokenExpiry.get();
        
        // Check if we have a cached token that's still valid (with 1 hour buffer)
        if (cachedToken.get() != null && cachedExpiry != null && currentTime < cachedExpiry - 3600) {
            return cachedToken.get();
        }
        
        // Generate new token
        long expiry = currentTime + (7 * 24 * 3600); // 1 week from now
        String token = generateToken("cdn", expiry);
        
        // Cache the token
        cachedToken.set(token);
        tokenExpiry.set(expiry);
        
        return token;
    }

    private String generateToken(String endpoints, long expiry) {
        try {
            String input = endpoints + expiry + apiSecret;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public long getCurrentExpiry() {
        return tokenExpiry.get() != null ? tokenExpiry.get() : 0;
    }

    public String generateFileSpecificToken(String filePath, long expiryTimestamp) {
        return generateToken(filePath, expiryTimestamp);
    }

    /**
     * Generate a file-specific token using duration (seconds from now) like the Python implementation
     */
    public String generateFileSpecificTokenWithDuration(String filePath, long expiresInSeconds) {
        long expiryTimestamp = Instant.now().getEpochSecond() + expiresInSeconds;
        return generateToken(filePath, expiryTimestamp);
    }
}
