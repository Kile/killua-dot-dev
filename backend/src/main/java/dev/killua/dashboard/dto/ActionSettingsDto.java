package dev.killua.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ActionSettingsDto {
    @JsonProperty("hug")
    private boolean hug;
    
    @JsonProperty("cuddle")
    private boolean cuddle;
    
    @JsonProperty("pat")
    private boolean pat;
    
    @JsonProperty("slap")
    private boolean slap;
    
    @JsonProperty("poke")
    private boolean poke;
    
    @JsonProperty("tickle")
    private boolean tickle;

    // Default constructor
    public ActionSettingsDto() {}

    // Constructor with all parameters
    public ActionSettingsDto(boolean hug, boolean cuddle, boolean pat, boolean slap, boolean poke, boolean tickle) {
        this.hug = hug;
        this.cuddle = cuddle;
        this.pat = pat;
        this.slap = slap;
        this.poke = poke;
        this.tickle = tickle;
    }

    // Getters and setters
    public boolean isHug() {
        return hug;
    }

    public void setHug(boolean hug) {
        this.hug = hug;
    }

    public boolean isCuddle() {
        return cuddle;
    }

    public void setCuddle(boolean cuddle) {
        this.cuddle = cuddle;
    }

    public boolean isPat() {
        return pat;
    }

    public void setPat(boolean pat) {
        this.pat = pat;
    }

    public boolean isSlap() {
        return slap;
    }

    public void setSlap(boolean slap) {
        this.slap = slap;
    }

    public boolean isPoke() {
        return poke;
    }

    public void setPoke(boolean poke) {
        this.poke = poke;
    }

    public boolean isTickle() {
        return tickle;
    }

    public void setTickle(boolean tickle) {
        this.tickle = tickle;
    }
}
