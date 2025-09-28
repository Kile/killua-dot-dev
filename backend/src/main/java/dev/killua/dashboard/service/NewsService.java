package dev.killua.dashboard.service;

import dev.killua.dashboard.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class NewsService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${external.api.base-url}")
    private String externalApiBaseUrl;

    @Autowired
    private DiscordTokenService discordTokenService;

    /**
     * Get all news items from external API
     */
    public NewsResponseDataDto getAllNews(String discordToken) throws Exception {
        try {
            String apiUrl = externalApiBaseUrl + "/news";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Add Discord token if present (for likes functionality)
            if (discordToken != null && !discordToken.isEmpty()) {
                headers.setBearerAuth(discordToken);
            }
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<NewsResponseDataDto> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                NewsResponseDataDto.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to fetch news from external API: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch news from external API: " + e.getMessage());
        }
    }

    /**
     * Get a specific news item by ID from external API
     */
    public NewsResponseDto getNewsById(String newsId, String discordToken) throws Exception {
        try {
            String apiUrl = externalApiBaseUrl + "/news/" + newsId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Add Discord token if present (for likes functionality)
            if (discordToken != null && !discordToken.isEmpty()) {
                headers.setBearerAuth(discordToken);
            }
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<NewsResponseDto> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                NewsResponseDto.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to fetch news item from external API: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch news item from external API: " + e.getMessage());
        }
    }

    /**
     * Like or unlike a news item
     */
    public Map<String, Object> likeNews(String jwtToken, String newsId) throws Exception {
        try {
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            String apiUrl = externalApiBaseUrl + "/news/like";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            LikeRequestDto likeRequest = new LikeRequestDto(newsId);
            HttpEntity<LikeRequestDto> request = new HttpEntity<>(likeRequest, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.POST, 
                request, 
                Map.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to like/unlike news item: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to like/unlike news item: " + e.getMessage());
        }
    }

    /**
     * Save/create a new news item (admin only)
     */
    public NewsSaveResponseDto saveNews(String jwtToken, CreateNewsRequestDto createRequest) throws Exception {
        try {
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            String apiUrl = externalApiBaseUrl + "/news/save";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<CreateNewsRequestDto> request = new HttpEntity<>(createRequest, headers);
            
            ResponseEntity<NewsSaveResponseDto> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.POST, 
                request, 
                NewsSaveResponseDto.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to save news item: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to save news item: " + e.getMessage());
        }
    }

    /**
     * Edit an existing news item (admin only)
     */
    public Map<String, Object> editNews(String jwtToken, String newsId, EditNewsRequestDto editRequest) throws Exception {
        try {
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            String apiUrl = externalApiBaseUrl + "/news/" + newsId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create a clean request object with only non-null fields
            Map<String, Object> cleanRequest = new java.util.HashMap<>();
            if (editRequest.getTitle() != null) cleanRequest.put("title", editRequest.getTitle());
            if (editRequest.getContent() != null) cleanRequest.put("content", editRequest.getContent());
            if (editRequest.getNewsType() != null) cleanRequest.put("type", editRequest.getNewsType());
            if (editRequest.getVersion() != null) cleanRequest.put("version", editRequest.getVersion());
            if (editRequest.getPublished() != null) cleanRequest.put("published", editRequest.getPublished());
            if (editRequest.getLinks() != null && !editRequest.getLinks().isEmpty()) cleanRequest.put("links", editRequest.getLinks());
            if (editRequest.getImages() != null && !editRequest.getImages().isEmpty()) cleanRequest.put("images", editRequest.getImages());
            if (editRequest.getNotifyUsers() != null) cleanRequest.put("notify_users", editRequest.getNotifyUsers());
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(cleanRequest, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.PUT, 
                request, 
                Map.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to edit news item: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to edit news item: " + e.getMessage());
        }
    }

    /**
     * Delete a news item (admin only)
     */
    public Map<String, Object> deleteNews(String jwtToken, String newsId) throws Exception {
        try {
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            String apiUrl = externalApiBaseUrl + "/news/" + newsId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.DELETE, 
                request, 
                Map.class
            );
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Failed to delete news item: " + response.getStatusCode());
            }
            
            return response.getBody();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete news item: " + e.getMessage());
        }
    }
}
