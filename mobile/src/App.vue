<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { getCurrentUser } from "@/services/foodieBuddy";
import { applyTheme, getSavedTheme } from "@/utils/theme";

onLaunch(() => {
  console.log("App Launch");
  applyTheme(getSavedTheme());
  getCurrentUser().catch((err) => {
    console.error("Auto login failed", err);
  });
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
