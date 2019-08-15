# gcloud builds submit --tag gcr.io/pimex-services/hooket:0.0.1
# gcloud beta run deploy --image gcr.io/pimex-services/hooket --platform managed --region us-central1 --allow-unauthenticated
FROM node:10

# Create and change to the app directory.
WORKDIR /usr/src/app

ENV PORT 8080
ENV HOST 0.0.0.0

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Run the web service on container startup.
CMD [ "npm", "start" ]