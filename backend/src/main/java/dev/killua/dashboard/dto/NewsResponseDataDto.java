package dev.killua.dashboard.dto;

import java.util.List;

public class NewsResponseDataDto {
    private List<NewsResponseDto> news;

    // Constructors
    public NewsResponseDataDto() {}

    public NewsResponseDataDto(List<NewsResponseDto> news) {
        this.news = news;
    }

    // Getters and Setters
    public List<NewsResponseDto> getNews() {
        return news;
    }

    public void setNews(List<NewsResponseDto> news) {
        this.news = news;
    }

    @Override
    public String toString() {
        return "NewsResponseDataDto{" +
                "news=" + news +
                '}';
    }
}
