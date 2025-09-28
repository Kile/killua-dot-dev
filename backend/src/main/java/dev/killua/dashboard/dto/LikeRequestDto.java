package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LikeRequestDto {
    @JsonProperty("news_id")
    private String newsId;

    // Constructors
    public LikeRequestDto() {}

    public LikeRequestDto(String newsId) {
        this.newsId = newsId;
    }

    // Getters and Setters
    public String getNewsId() {
        return newsId;
    }

    public void setNewsId(String newsId) {
        this.newsId = newsId;
    }

    @Override
    public String toString() {
        return "LikeRequestDto{" +
                "newsId='" + newsId + '\'' +
                '}';
    }
}
