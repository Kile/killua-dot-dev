package dev.killua.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "discord_tokens")
public class DiscordToken {
    
    @Id
    @Column(name = "jwt_token", length = 1000)
    private String jwtToken;
    
    @Column(name = "discord_token", length = 1000, nullable = false)
    private String discordToken;
    
    @Column(name = "discord_id", nullable = false)
    private String discordId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    // Default constructor for JPA
    public DiscordToken() {}
    
    public DiscordToken(String jwtToken, String discordToken, String discordId) {
        this.jwtToken = jwtToken;
        this.discordToken = discordToken;
        this.discordId = discordId;
        this.createdAt = LocalDateTime.now();
        // Discord tokens typically expire in 7 days
        this.expiresAt = LocalDateTime.now().plusDays(7);
    }
    
    // Getters and Setters
    public String getJwtToken() {
        return jwtToken;
    }
    
    public void setJwtToken(String jwtToken) {
        this.jwtToken = jwtToken;
    }
    
    public String getDiscordToken() {
        return discordToken;
    }
    
    public void setDiscordToken(String discordToken) {
        this.discordToken = discordToken;
    }
    
    public String getDiscordId() {
        return discordId;
    }
    
    public void setDiscordId(String discordId) {
        this.discordId = discordId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
