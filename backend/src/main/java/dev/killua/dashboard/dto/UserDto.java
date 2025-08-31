package dev.killua.dashboard.dto;

import java.time.LocalDateTime;

public class UserDto {
    private String discordId;
    private String username;
    private String discriminator;
    private String avatar;
    private String banner;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private boolean isPremium;
    private String premiumTier;
    private LocalDateTime premiumExpires;

    // Constructors
    public UserDto() {}

    public UserDto(String discordId, String username, String discriminator, String avatar) {
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
        return "UserDto{" +
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
