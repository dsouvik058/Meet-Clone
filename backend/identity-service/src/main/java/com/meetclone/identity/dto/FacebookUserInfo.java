package com.meetclone.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FacebookUserInfo(
        @JsonProperty("id") String id,
        @JsonProperty("name") String name,
        @JsonProperty("email") String email,
        @JsonProperty("picture") PictureObj picture
) {
    public record PictureObj(
            @JsonProperty("data") PictureData data
    ) {}

    public record PictureData(
            @JsonProperty("url") String url,
            @JsonProperty("is_silhouette") Boolean isSilhouette,
            @JsonProperty("height") Integer height,
            @JsonProperty("width") Integer width
    ) {}

    public String getAvatarUrl() {
        if (picture != null && picture.data() != null && picture.data().url() != null) {
            return picture.data().url();
        }
        return null;
    }
}
