package com.meetclone.identity.oauth;

import com.meetclone.identity.dto.DiscordTokenResponse;
import com.meetclone.identity.dto.DiscordUserInfo;
import com.meetclone.identity.dto.OAuthUserProfile;
import com.meetclone.identity.exception.InvalidCredentialsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class DiscordOAuthProviderHandler implements OAuthProviderHandler {

    public static final String PROVIDER_NAME = "DISCORD";
    private static final String DISCORD_TOKEN_URI = "https://discord.com/api/v10/oauth2/token";
    private static final String DISCORD_USER_INFO_URI = "https://discord.com/api/v10/users/@me";
    private static final String USER_AGENT = "MeetCloneOAuth/1.0";

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public DiscordOAuthProviderHandler(
            RestClient restClient,
            @Value("${app.oauth2.discord.client-id}") String clientId,
            @Value("${app.oauth2.discord.client-secret}") String clientSecret,
            @Value("${app.oauth2.discord.redirect-uri}") String redirectUri
    ) {
        this.restClient = restClient;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public String getAuthorizationUrl() {
        return "https://discord.com/oauth2/authorize" +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("identify email", StandardCharsets.UTF_8) +
                "&prompt=consent";
    }

    @Override
    public OAuthUserProfile fetchUserProfile(String authCode) {
        DiscordTokenResponse tokenResponse = exchangeAuthCodeForTokens(authCode);
        if (tokenResponse == null || tokenResponse.accessToken() == null) {
            throw new InvalidCredentialsException("Failed to obtain access token from Discord");
        }

        DiscordUserInfo userInfo = fetchDiscordUserInfo(tokenResponse.accessToken());
        if (userInfo == null || userInfo.id() == null) {
            throw new InvalidCredentialsException("Failed to retrieve user profile from Discord");
        }

        if (userInfo.email() == null || userInfo.email().isBlank()) {
            throw new InvalidCredentialsException("Discord account does not have an associated email or email scope was not granted");
        }

        return new OAuthUserProfile(
                userInfo.id(),
                userInfo.email(),
                userInfo.getDisplayName(),
                userInfo.getComputedAvatarUrl()
        );
    }

    private DiscordTokenResponse exchangeAuthCodeForTokens(String authCode) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", authCode);
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");

        try {
            return restClient.post()
                    .uri(DISCORD_TOKEN_URI)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .header("User-Agent", USER_AGENT)
                    .body(body)
                    .retrieve()
                    .body(DiscordTokenResponse.class);
        } catch (Exception e) {
            throw new InvalidCredentialsException("Error exchanging Discord authorization code: " + e.getMessage());
        }
    }

    private DiscordUserInfo fetchDiscordUserInfo(String discordAccessToken) {
        try {
            return restClient.get()
                    .uri(DISCORD_USER_INFO_URI)
                    .header("Authorization", "Bearer " + discordAccessToken)
                    .header("User-Agent", USER_AGENT)
                    .retrieve()
                    .body(DiscordUserInfo.class);
        } catch (Exception e) {
            throw new InvalidCredentialsException("Error fetching user info from Discord: " + e.getMessage());
        }
    }
}
