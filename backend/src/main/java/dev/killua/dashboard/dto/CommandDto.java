package dev.killua.dashboard.dto;

import java.util.List;

public class CommandDto {
    private Long id;
    private String name;
    private String description;
    private String usage;
    private String slashCommand;
    private String category;
    private List<String> aliases;
    private List<String> examples;
    private boolean isEnabled;
    private boolean requiresPremium;
    private String minPremiumTier;
    private Integer cooldownSeconds;
    private List<String> permissions;

    // Constructors
    public CommandDto() {}

    public CommandDto(String name, String description, String usage, String slashCommand, String category) {
        this.name = name;
        this.description = description;
        this.usage = usage;
        this.slashCommand = slashCommand;
        this.category = category;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUsage() {
        return usage;
    }

    public void setUsage(String usage) {
        this.usage = usage;
    }

    public String getSlashCommand() {
        return slashCommand;
    }

    public void setSlashCommand(String slashCommand) {
        this.slashCommand = slashCommand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getAliases() {
        return aliases;
    }

    public void setAliases(List<String> aliases) {
        this.aliases = aliases;
    }

    public List<String> getExamples() {
        return examples;
    }

    public void setExamples(List<String> examples) {
        this.examples = examples;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }

    public boolean isRequiresPremium() {
        return requiresPremium;
    }

    public void setRequiresPremium(boolean requiresPremium) {
        this.requiresPremium = requiresPremium;
    }

    public String getMinPremiumTier() {
        return minPremiumTier;
    }

    public void setMinPremiumTier(String minPremiumTier) {
        this.minPremiumTier = minPremiumTier;
    }

    public Integer getCooldownSeconds() {
        return cooldownSeconds;
    }

    public void setCooldownSeconds(Integer cooldownSeconds) {
        this.cooldownSeconds = cooldownSeconds;
    }

    public List<String> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }

    @Override
    public String toString() {
        return "CommandDto{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", usage='" + usage + '\'' +
                ", slashCommand='" + slashCommand + '\'' +
                ", category='" + category + '\'' +
                ", aliases=" + aliases +
                ", examples=" + examples +
                ", isEnabled=" + isEnabled +
                ", requiresPremium=" + requiresPremium +
                ", minPremiumTier='" + minPremiumTier + '\'' +
                ", cooldownSeconds=" + cooldownSeconds +
                ", permissions=" + permissions +
                '}';
    }
}
