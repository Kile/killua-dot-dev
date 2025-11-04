package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserEditRequestDto {
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("action_settings")
    private ActionSettingsDto actionSettings;
    
    @JsonProperty("email_notifications")
    private EmailNotificationsDto emailNotifications;
    
    @JsonProperty("voting_reminder")
    private Boolean votingReminder;

    // Default constructor
    public UserEditRequestDto() {}

    // Constructor with all parameters
    public UserEditRequestDto(String userId, ActionSettingsDto actionSettings, EmailNotificationsDto emailNotifications, Boolean votingReminder) {
        this.userId = userId;
        this.actionSettings = actionSettings;
        this.emailNotifications = emailNotifications;
        this.votingReminder = votingReminder;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public ActionSettingsDto getActionSettings() {
        return actionSettings;
    }

    public void setActionSettings(ActionSettingsDto actionSettings) {
        this.actionSettings = actionSettings;
    }

    public EmailNotificationsDto getEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(EmailNotificationsDto emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public Boolean getVotingReminder() {
        return votingReminder;
    }

    public void setVotingReminder(Boolean votingReminder) {
        this.votingReminder = votingReminder;
    }
}

