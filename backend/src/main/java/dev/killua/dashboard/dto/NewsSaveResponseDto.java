package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NewsSaveResponseDto {
    @JsonProperty("news_id")
    private String newsId;
    
    @JsonProperty("message_id")
    private String messageId;

    // Constructors
    public NewsSaveResponseDto() {}

    public NewsSaveResponseDto(String newsId, String messageId) {
        this.newsId = newsId;
        this.messageId = messageId;
    }

    // Getters and Setters
    public String getNewsId() {
        return newsId;
    }

    public void setNewsId(String newsId) {
        this.newsId = newsId;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    @Override
    public String toString() {
        return "NewsSaveResponseDto{" +
                "newsId='" + newsId + '\'' +
                ", messageId='" + messageId + '\'' +
                '}';
    }
}
