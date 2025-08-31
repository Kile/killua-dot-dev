package dev.killua.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @Column(name = "discord_id")
    private String discordId;
    
    @Column(name = "username", nullable = false)
    private String username;
    
    @Column(name = "discriminator")
    private String discriminator;
    
    @Column(name = "avatar")
    private String avatar;
    
    @Column(name = "banner")
    private String banner;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @Column(name = "is_premium")
    private boolean isPremium = false;
    
    @Column(name = "premium_tier")
    private String premiumTier;
    
    @Column(name = "premium_expires")
    private LocalDateTime premiumExpires;

    // Constructors
    public User() {
        this.createdAt = LocalDateTime.now();
    }

    public User(String discordId, String username, String discriminator, String avatar) {
        this();
        this.discordId = discordId;
        this.username = username;
        this.discriminator = discriminator;
        this.avatar = avatar;
    }

    // Getters and Setters
    public String getDiscordId() {
        return discordId;
    }

    public void setDiscordId(String discordId) {
        this.discordId = discordId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDiscriminator() {
        return discriminator;
    }

    public void setDiscriminator(String discriminator) {
        this.discriminator = discriminator;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getBanner() {
        return banner;
    }

    public void setBanner(String banner) {
        this.banner = banner;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public boolean isPremium() {
        return isPremium;
    }

    public void setPremium(boolean premium) {
        isPremium = premium;
    }

    public String getPremiumTier() {
        return premiumTier;
    }

    public void setPremiumTier(String premiumTier) {
        this.premiumTier = premiumTier;
    }

    public LocalDateTime getPremiumExpires() {
        return premiumExpires;
    }

    public void setPremiumExpires(LocalDateTime premiumExpires) {
        this.premiumExpires = premiumExpires;
    }

    @Override
    public String toString() {
        return "User{" +
                "discordId='" + discordId + '\'' +
                ", username='" + username + '\'' +
                ", discriminator='" + discriminator + '\'' +
                ", avatar='" + avatar + '\'' +
                ", banner='" + banner + '\'' +
                ", email='" + email + '\'' +
                ", createdAt=" + createdAt +
                ", lastLogin=" + lastLogin +
                ", isPremium=" + isPremium +
                ", premiumTier='" + premiumTier + '\'' +
                ", premiumExpires=" + premiumExpires +
                '}';
    }
}
