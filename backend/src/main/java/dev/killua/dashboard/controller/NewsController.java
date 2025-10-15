package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.*;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import dev.killua.dashboard.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "*")
public class NewsController extends BaseController {

    @Autowired
    private NewsService newsService;

    @Autowired
    private AuthService authService;

    @Autowired
    private DiscordTokenService discordTokenService;

    public NewsController(RestTemplate restTemplate) {
        super(restTemplate);
    }

    /**
     * Get all news items
     */
    @GetMapping
    public ResponseEntity<?> getAllNews(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String discordToken = null;
            
            // Try to get Discord token if user is logged in
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String jwtToken = authHeader.substring(7);
                    UserDto user = authService.verifyToken(jwtToken);
                    if (user != null) {
                        discordToken = discordTokenService.getDiscordToken(jwtToken);
                    }
                } catch (Exception e) {
                    // User not logged in or token invalid, continue without Discord token
                }
            }
            
            NewsResponseDataDto newsData = newsService.getAllNews(discordToken);
            return ResponseEntity.ok(newsData);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to fetch news: " + e.getMessage()));
        }
    }

    /**
     * Get a specific news item by ID
     */
    @GetMapping("/{newsId}")
    public ResponseEntity<?> getNewsById(@PathVariable String newsId, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String discordToken = null;
            
            // Try to get Discord token if user is logged in
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String jwtToken = authHeader.substring(7);
                    UserDto user = authService.verifyToken(jwtToken);
                    if (user != null) {
                        discordToken = discordTokenService.getDiscordToken(jwtToken);
                    }
                } catch (Exception e) {
                    // User not logged in or token invalid, continue without Discord token
                }
            }
            
            NewsResponseDto news = newsService.getNewsById(newsId, discordToken);
            return ResponseEntity.ok(news);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to fetch news item: " + e.getMessage()));
        }
    }

    /**
     * Like or unlike a news item
     */
    @PostMapping("/like")
    public ResponseEntity<?> likeNews(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LikeRequestDto likeRequest) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            Map<String, Object> result = newsService.likeNews(jwtToken, likeRequest.getNewsId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to like/unlike news: " + e.getMessage()));
        }
    }

    /**
     * Save/create a new news item (admin only)
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveNews(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateNewsRequestDto createRequest) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify user is admin
            UserDto user = authService.verifyToken(jwtToken);
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }
            
            NewsSaveResponseDto result = newsService.saveNews(jwtToken, createRequest);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to save news: " + e.getMessage()));
        }
    }

    /**
     * Edit an existing news item (admin only)
     */
    @PutMapping("/{newsId}")
    public ResponseEntity<?> editNews(
            @PathVariable String newsId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody EditNewsRequestDto editRequest) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify user is admin
            UserDto user = authService.verifyToken(jwtToken);
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }
            
            Map<String, Object> result = newsService.editNews(jwtToken, newsId, editRequest);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to edit news: " + e.getMessage()));
        }
    }

    /**
     * Delete a news item (admin only)
     */
    @DeleteMapping("/{newsId}")
    public ResponseEntity<?> deleteNews(
            @PathVariable String newsId,
            @RequestHeader("Authorization") String authHeader) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            // Verify user is admin
            UserDto user = authService.verifyToken(jwtToken);
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }
            
            Map<String, Object> result = newsService.deleteNews(jwtToken, newsId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to delete news: " + e.getMessage()));
        }
    }
}
