package dev.killua.dashboard.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

/**
 * Base controller providing common functionality for external API calls
 */
public abstract class BaseController {

    @Value("${external.api.base-url:https://api.killua.dev}")
    protected String externalApiBaseUrl;

    protected RestTemplate restTemplate;

    public BaseController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Gets the base URL for external API calls with fallback
     * @return The configured base URL or default fallback
     */
    protected String getBaseUrl() {
        return (externalApiBaseUrl != null && !externalApiBaseUrl.isBlank())
            ? externalApiBaseUrl
            : "https://api.killua.dev";
    }
}
