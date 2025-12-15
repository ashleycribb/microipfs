# Use the official Node.js LTS Alpine image for a small footprint
FROM node:lts-alpine

# Set up a non-root user for security
USER node

# Set the home directory and update the PATH
ENV HOME=/home/node PATH=/home/node/.local/bin:$PATH

# Set the working directory inside the container
WORKDIR $HOME/app

# Copy the package.json and package-lock.json files
COPY --chown=node package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files
COPY --chown=node . .

# Expose the port that Hugging Face Spaces uses
EXPOSE 7860

# The command to start the application
CMD ["node", "index.js"]
