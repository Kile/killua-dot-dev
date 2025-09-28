package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NewsIdRequestDto {
    @JsonProperty("news_id")
    private String newsId;

    // Constructors
    public NewsIdRequestDto() {}

    public NewsIdRequestDto(String newsId) {
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
        return "NewsIdRequestDto{" +
                "newsId='" + newsId + '\'' +
                '}';
    }
}
