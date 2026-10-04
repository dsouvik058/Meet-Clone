package com.meetclone.identity.oauth;

import com.meetclone.identity.dto.FacebookTokenResponse;
import com.meetclone.identity.dto.FacebookUserInfo;
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
public class FacebookOAuthProviderHandler implements OAuthProviderHandler {

    public static final String PROVIDER_NAME = "FACEBOOK";
    private static final String FACEBOOK_AUTH_URI = "https://www.facebook.com/v19.0/dialog/oauth";
    private static final String FACEBOOK_TOKEN_URI = "https://graph.facebook.com/v19.0/oauth/access_token";
    private static final String FACEBOOK_USER_INFO_URI = "https://graph.facebook.com/v19.0/me";

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;

    public FacebookOAuthProviderHandler(
            RestClient restClient,
            @Value("${app.oauth2.facebook.client-id}") String clientId,
            @Value("${app.oauth2.facebook.client-secret}") String clientSecret,
            @Value("${app.oauth2.facebook.redirect-uri}") String redirectUri
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
        validateConfig();
        return FACEBOOK_AUTH_URI +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("email,public_profile", StandardCharsets.UTF_8);
    }

    @Override
    public OAuthUserProfile fetchUserProfile(String authCode) {
        validateConfig();
        FacebookTokenResponse tokenResponse = exchangeAuthCodeForTokens(authCode);
        if (tokenResponse == null || tokenResponse.accessToken() == null) {
            throw new InvalidCredentialsException("Failed to obtain access token from Facebook");
        }

        FacebookUserInfo userInfo = fetchFacebookUserInfo(tokenResponse.accessToken());
        if (userInfo == null || userInfo.id() == null) {
            throw new InvalidCredentialsException("Failed to retrieve user profile from Facebook");
        }

        if (userInfo.email() == null || userInfo.email().isBlank()) {
            throw new InvalidCredentialsException("Facebook account does not have an associated email address or email permission was not granted");
        }

        return new OAuthUserProfile(
                userInfo.id(),
                userInfo.email(),
                userInfo.name() != null ? userInfo.name().trim() : "Facebook User",
                userInfo.getAvatarUrl()
        );
    }

    private FacebookTokenResponse exchangeAuthCodeForTokens(String authCode) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", authCode);
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri", redirectUri);

        try {
            return restClient.post()
                    .uri(FACEBOOK_TOKEN_URI)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON, MediaType.valueOf("text/javascript"))
                    .body(body)
                    .retrieve()
                    .body(FacebookTokenResponse.class);
        } catch (Exception e) {
            throw new InvalidCredentialsException("Error exchanging Facebook authorization code: " + e.getMessage());
        }
    }

    private FacebookUserInfo fetchFacebookUserInfo(String facebookAccessToken) {
        try {
            return restClient.get()
                    .uri(FACEBOOK_USER_INFO_URI + "?fields=id,name,email,picture.type(large)")
                    .header("Authorization", "Bearer " + facebookAccessToken)
                    .accept(MediaType.APPLICATION_JSON, MediaType.valueOf("text/javascript"))
                    .retrieve()
                    .body(FacebookUserInfo.class);
        } catch (Exception e) {
            throw new InvalidCredentialsException("Error fetching user info from Facebook: " + e.getMessage());
        }
    }

    private void validateConfig() {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("Facebook OAuth client-id and client-secret must be configured in environment");
        }
    }
}
