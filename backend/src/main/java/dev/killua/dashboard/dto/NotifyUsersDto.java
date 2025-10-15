package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NotifyUsersDto {
    @JsonProperty("type")
    private NotifyType notifyType;
    
    private NotifyData data;

    // Constructors
    public NotifyUsersDto() {}

    public NotifyUsersDto(NotifyType notifyType, NotifyData data) {
        this.notifyType = notifyType;
        this.data = data;
    }

    // Getters and Setters
    public NotifyType getNotifyType() {
        return notifyType;
    }

    public void setNotifyType(NotifyType notifyType) {
        this.notifyType = notifyType;
    }

    public NotifyData getData() {
        return data;
    }

    public void setData(NotifyData data) {
        this.data = data;
    }

    @Override
    public String toString() {
        return "NotifyUsersDto{" +
                "notifyType=" + notifyType +
                ", data=" + data +
                '}';
    }
}
