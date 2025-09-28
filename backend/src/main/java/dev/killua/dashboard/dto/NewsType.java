package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum NewsType {
    @JsonProperty("news")
    NEWS,
    
    @JsonProperty("update")
    UPDATE,
    
    @JsonProperty("post")
    POST
}
