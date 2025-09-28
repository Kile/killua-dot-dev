package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum NotifyType {
    @JsonProperty("group")
    GROUP,
    
    @JsonProperty("specific")
    SPECIFIC
}
