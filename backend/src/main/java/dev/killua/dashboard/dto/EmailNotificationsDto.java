package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EmailNotificationsDto {
    @JsonProperty("news")
    private boolean news;
    
    @JsonProperty("updates")
    private boolean updates;
    
    @JsonProperty("posts")
    private boolean posts;

    // Default constructor
    public EmailNotificationsDto() {}

    // Constructor with all parameters
    public EmailNotificationsDto(boolean news, boolean updates, boolean posts) {
        this.news = news;
        this.updates = updates;
        this.posts = posts;
    }

    // Getters and setters
    public boolean isNews() {
        return news;
    }

    public void setNews(boolean news) {
        this.news = news;
    }

    public boolean isUpdates() {
        return updates;
    }

    public void setUpdates(boolean updates) {
        this.updates = updates;
    }

    public boolean isPosts() {
        return posts;
    }

    public void setPosts(boolean posts) {
        this.posts = posts;
    }
}

