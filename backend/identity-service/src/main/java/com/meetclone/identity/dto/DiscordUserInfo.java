package com.meetclone.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DiscordUserInfo(
        @JsonProperty("id") String id,
        @JsonProperty("username") String username,
        @JsonProperty("discriminator") String discriminator,
        @JsonProperty("global_name") String globalName,
        @JsonProperty("avatar") String avatar,
        @JsonProperty("email") String email,
        @JsonProperty("verified") Boolean verified
) {
    public String getDisplayName() {
        if (globalName != null && !globalName.isBlank()) {
            return globalName.trim();
        }
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        return "Discord User";
    }

    public String getComputedAvatarUrl() {
        if (avatar != null && !avatar.isBlank()) {
            return "https://cdn.discordapp.com/avatars/" + id + "/" + avatar + ".png";
        }
        if (id != null) {
            try {
                long userId = Long.parseLong(id);
                long defaultIndex = (userId >> 22) % 6;
                return "https://cdn.discordapp.com/embed/avatars/" + defaultIndex + ".png";
            } catch (Exception ignored) {
                // fall through
            }
        }
        return "https://cdn.discordapp.com/embed/avatars/0.png";
    }
}
