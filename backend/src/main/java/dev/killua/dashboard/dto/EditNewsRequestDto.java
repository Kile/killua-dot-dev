package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class EditNewsRequestDto {
    private String title;
    private String content;
    
    @JsonProperty("type")
    private NewsType newsType;
    
    private String version;
    private Boolean published;
    private Map<String, String> links;
    private List<String> images;
    
    @JsonProperty("notify_users")
    private NotifyUsersDto notifyUsers;

    // Constructors
    public EditNewsRequestDto() {
        this.links = new java.util.HashMap<>();
        this.images = new java.util.ArrayList<>();
    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public NewsType getNewsType() {
        return newsType;
    }

    public void setNewsType(NewsType newsType) {
        this.newsType = newsType;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public Map<String, String> getLinks() {
        return links;
    }

    public void setLinks(Map<String, String> links) {
        this.links = links;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public NotifyUsersDto getNotifyUsers() {
        return notifyUsers;
    }

    public void setNotifyUsers(NotifyUsersDto notifyUsers) {
        this.notifyUsers = notifyUsers;
    }

    @Override
    public String toString() {
        return "EditNewsRequestDto{" +
                "title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", newsType=" + newsType +
                ", version='" + version + '\'' +
                ", published=" + published +
                ", links=" + links +
                ", images=" + images +
                ", notifyUsers=" + notifyUsers +
                '}';
    }
}
