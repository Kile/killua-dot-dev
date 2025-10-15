package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import dev.killua.dashboard.service.CdnTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;
import java.time.Instant;

@RestController
@RequestMapping("/api/image")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private DiscordTokenService discordTokenService;

    @Autowired
    private CdnTokenService cdnTokenService;

    @Value("${external.api.base-url}")
    private String externalApiBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private ResponseEntity<?> handleExternalApiError(Exception e) {
        // Check if it's an HttpStatusCodeException (HTTP error from external API)
        if (e instanceof org.springframework.web.client.HttpStatusCodeException) {
            org.springframework.web.client.HttpStatusCodeException httpException = 
                (org.springframework.web.client.HttpStatusCodeException) e;
            
            // Try to parse the error response from external API
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode errorNode = objectMapper.readTree(httpException.getResponseBodyAsString());
                
                // If the external API returns a structured error, extract the message
                if (errorNode.has("error")) {
                    String errorMessage = errorNode.get("error").asText();
                    return ResponseEntity.status(httpException.getStatusCode())
                        .body(Map.of("error", errorMessage));
                } else {
                    // Fallback to the raw response body
                    return ResponseEntity.status(httpException.getStatusCode())
                        .body(Map.of("error", httpException.getResponseBodyAsString()));
                }
            } catch (Exception parseException) {
                // If we can't parse the error response, use the original message
                return ResponseEntity.status(httpException.getStatusCode())
                    .body(Map.of("error", httpException.getResponseBodyAsString()));
            }
        } else {
            // For non-HTTP exceptions, return the original message
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("path") String path,
            @RequestParam("file") MultipartFile file) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Prepare the request to external API
            String apiUrl = externalApiBaseUrl + "/image/upload?path=" + path;
            
            // Send just the file bytes
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            
            HttpEntity<byte[]> request = new HttpEntity<>(file.getBytes(), headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.POST, 
                request, 
                String.class
            );
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @PutMapping("/edit")
    public ResponseEntity<?> editFilePath(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("path") String path,
            @RequestParam("new_path") String newPath) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Prepare the request to external API
            String apiUrl = externalApiBaseUrl + "/image/edit?path=" + path + "&new_path=" + newPath;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.PUT, 
                request, 
                String.class
            );
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteFile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("path") String path) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Prepare the request to external API
            String apiUrl = externalApiBaseUrl + "/image/delete?path=" + path;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.DELETE, 
                request, 
                String.class
            );
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> listFiles(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get the Discord token from the service to use for the external API call
            String discordToken = discordTokenService.getDiscordToken(jwtToken);
            
            if (discordToken == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Discord token not found"));
            }
            
            // Prepare the request to external API
            String apiUrl = externalApiBaseUrl + "/image/list";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(discordToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                String.class
            );
            
            // Parse the response to extract just the files array
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode responseNode = objectMapper.readTree(response.getBody());
            JsonNode filesNode = responseNode.get("files");
            
            return ResponseEntity.ok(filesNode.toString());
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @GetMapping("/{path:.+}")
    public ResponseEntity<?> getFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String path) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get CDN token for file access
            String cdnToken = cdnTokenService.getCdnToken();
            long expiry = cdnTokenService.getCurrentExpiry();
            
            // Prepare the request to external API with CDN token
            String apiUrl = externalApiBaseUrl + "/image/cdn/" + path + "?token=" + cdnToken + "&expiry=" + expiry;
            
            HttpHeaders headers = new HttpHeaders();
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                request, 
                byte[].class
            );
            
            // Create response headers
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            responseHeaders.setContentDispositionFormData("attachment", path);
            
            return new ResponseEntity<>(response.getBody(), responseHeaders, HttpStatus.OK);
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @GetMapping("/fileviewer-token")
    public ResponseEntity<?> getFileViewerToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Get CDN token and expiry for file viewing
            String cdnToken = cdnTokenService.getCdnToken();
            long expiry = cdnTokenService.getCurrentExpiry();
            
            return ResponseEntity.ok(Map.of(
                "token", cdnToken,
                "expiry", expiry,
                "baseUrl", externalApiBaseUrl + "/image/cdn"
            ));
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }

    @PostMapping("/generate-link")
    public ResponseEntity<?> generateFileLink(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("path") String path,
            @RequestParam("expiry") long expiryTimestamp) {
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
        }

        String jwtToken = authHeader.substring(7);
        
        try {
            UserDto user = authService.verifyToken(jwtToken);
            
            // Check if user is admin
            if (!authService.isAdmin(user.getDiscordId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin privileges required."));
            }
            
            // Calculate duration from now until expiry timestamp
            long currentTime = Instant.now().getEpochSecond();
            long expiresInSeconds = expiryTimestamp - currentTime;
            
            if (expiresInSeconds <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Expiry time must be in the future"));
            }
            
            // Normalize the path to ensure it's in the correct format for the hash algorithm
            // The hash algorithm expects "cdn/<image>" format
            String normalizedPath = path;
            if (normalizedPath.startsWith("/image/")) {
                normalizedPath = "cdn" + normalizedPath.substring(6); // Remove "/image/" and add "cdn"
            } else if (normalizedPath.startsWith("image/")) {
                normalizedPath = "cdn/" + normalizedPath.substring(6); // Remove "image/" and add "cdn/"
            } else if (!normalizedPath.startsWith("cdn/")) {
                normalizedPath = "cdn/" + normalizedPath; // Add "cdn/" prefix if not present
            }
            
            // Generate file-specific token using duration like Python implementation
            String fileSpecificToken = cdnTokenService.generateFileSpecificTokenWithDuration(normalizedPath, expiresInSeconds);
            
            // Create the full URL
            String fileUrl = externalApiBaseUrl + "/image/cdn/" + path + "?token=" + fileSpecificToken + "&expiry=" + expiryTimestamp;
            
            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "token", fileSpecificToken,
                "expiry", expiryTimestamp
            ));
            
        } catch (Exception e) {
            return handleExternalApiError(e);
        }
    }
}
