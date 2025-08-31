package dev.killua.dashboard.service;

import dev.killua.dashboard.entity.DiscordToken;
import dev.killua.dashboard.repository.DiscordTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class DiscordTokenService {
    
    @Autowired
    private DiscordTokenRepository discordTokenRepository;
    
    /**
     * Store a Discord OAuth token mapped to a JWT token
     */
    public void storeDiscordToken(String jwtToken, String discordToken, String discordId) {
        DiscordToken token = new DiscordToken(jwtToken, discordToken, discordId);
        discordTokenRepository.save(token);
    }
    
    /**
     * Retrieve a Discord OAuth token using a JWT token
     */
    public String getDiscordToken(String jwtToken) {
        Optional<DiscordToken> token = discordTokenRepository.findByJwtToken(jwtToken);
        if (token.isPresent() && !token.get().isExpired()) {
            return token.get().getDiscordToken();
        }
        return null;
    }
    
    /**
     * Remove a Discord OAuth token when JWT is invalidated
     */
    public void removeDiscordToken(String jwtToken) {
        discordTokenRepository.deleteByJwtToken(jwtToken);
    }
    
    /**
     * Check if a Discord token exists for a JWT
     */
    public boolean hasDiscordToken(String jwtToken) {
        Optional<DiscordToken> token = discordTokenRepository.findByJwtToken(jwtToken);
        return token.isPresent() && !token.get().isExpired();
    }
    
    /**
     * Get Discord token by Discord ID
     */
    public String getDiscordTokenByDiscordId(String discordId) {
        Optional<DiscordToken> token = discordTokenRepository.findByDiscordId(discordId);
        if (token.isPresent() && !token.get().isExpired()) {
            return token.get().getDiscordToken();
        }
        return null;
    }
    
    /**
     * Clean up expired tokens (runs every hour)
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void cleanupExpiredTokens() {
        discordTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
