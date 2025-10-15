package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class NewsResponseDto {
    @JsonProperty("_id")
    private String id;
    
    private String title;
    private String content;
    
    @JsonProperty("type")
    private NewsType newsType;
    
    private int likes;
    private boolean liked;
    private AuthorInfoDto author;
    private String version;
    
    @JsonProperty("message_id")
    private String messageId;
    
    private boolean published;
    private LocalDateTime timestamp;
    private Map<String, String> links;
    private List<String> images;
    
    @JsonProperty("notify_users")
    private NotifyUsersDto notifyUsers;

    // Constructors
    public NewsResponseDto() {
        this.links = new java.util.HashMap<>();
        this.images = new java.util.ArrayList<>();
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    public AuthorInfoDto getAuthor() {
        return author;
    }

    public void setAuthor(AuthorInfoDto author) {
        this.author = author;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public boolean isPublished() {
        return published;
    }

    public void setPublished(boolean published) {
        this.published = published;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
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
        return "NewsResponseDto{" +
                "id='" + id + '\'' +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", newsType=" + newsType +
                ", likes=" + likes +
                ", liked=" + liked +
                ", author=" + author +
                ", version='" + version + '\'' +
                ", messageId='" + messageId + '\'' +
                ", published=" + published +
                ", timestamp=" + timestamp +
                ", links=" + links +
                ", images=" + images +
                ", notifyUsers=" + notifyUsers +
                '}';
    }
}
