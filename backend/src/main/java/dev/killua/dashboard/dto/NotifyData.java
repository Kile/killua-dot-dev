package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.List;

public class NotifyData {
    // This can be either a list of user IDs or a special string
    // Using Object to handle both cases during deserialization
    private Object data;

    // Constructors
    public NotifyData() {}

    public NotifyData(Object data) {
        this.data = data;
    }

    // Constructor for String values (special strings)
    @JsonCreator
    public static NotifyData fromString(String value) {
        return new NotifyData(value);
    }

    // Constructor for List values (user IDs)
    @JsonCreator
    public static NotifyData fromList(List<Long> value) {
        return new NotifyData(value);
    }

    // Custom serialization to match Rust untagged enum
    @JsonValue
    public Object getValue() {
        return data;
    }

    // Getters and Setters
    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    // Helper methods to check the type of data
    public boolean isUserIds() {
        return data instanceof List;
    }

    public boolean isSpecial() {
        return data instanceof String;
    }

    @SuppressWarnings("unchecked")
    public List<Long> getUserIds() {
        if (isUserIds()) {
            return (List<Long>) data;
        }
        return null;
    }

    public String getSpecial() {
        if (isSpecial()) {
            return (String) data;
        }
        return null;
    }

    @Override
    public String toString() {
        return "NotifyData{" +
                "data=" + data +
                '}';
    }
}
