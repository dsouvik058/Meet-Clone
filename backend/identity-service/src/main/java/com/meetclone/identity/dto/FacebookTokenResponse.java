package com.meetclone.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FacebookTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("token_type") String tokenType,
        @JsonProperty("expires_in") Long expiresIn
) {}
