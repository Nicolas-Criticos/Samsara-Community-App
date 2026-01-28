# Samsara-Community-App
This App is for the Inner circle of Samsara to communicate and track projects happening on the land.

## Deploy
### Build
```shell
docker build -t jrfmdev/samsara-community-app:prod . --no-cache
```

### Push
```shell
docker push jrfmdev/samsara-community-app:prod
```

### Restart App on ArgoCD
Click the 3 dots on the "deploy" tile and then click "Restart"

https://deploy.simplydevops.co.za/applications/argocd/prod-samsara-community-app?view=tree&resource=

