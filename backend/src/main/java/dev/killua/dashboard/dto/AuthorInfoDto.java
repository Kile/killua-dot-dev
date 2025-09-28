package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthorInfoDto {
    @JsonProperty("display_name")
    private String displayName;
    
    @JsonProperty("avatar_url")
    private String avatarUrl;

    // Constructors
    public AuthorInfoDto() {}

    public AuthorInfoDto(String displayName, String avatarUrl) {
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
    }

    // Getters and Setters
    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    @Override
    public String toString() {
        return "AuthorInfoDto{" +
                "displayName='" + displayName + '\'' +
                ", avatarUrl='" + avatarUrl + '\'' +
                '}';
    }
}
