FROM rust:slim

# Install essential tools first (including curl)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    zsh \
    sudo \
    build-essential \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install GitHub CLI
RUN type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y) && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    sudo apt update && \
    sudo apt install gh -y

# Create a non-root user (replace existing node user)
RUN userdel -r node || true && \
    groupadd -g 1000 developer && \
    useradd -m -u 1000 -g 1000 -s /bin/zsh developer && \
    echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set working directory
WORKDIR /projects

# Change ownership of projects directory to developer user
RUN chown -R developer:developer /projects

# Switch to non-root user
USER developer

# Set up npm user-level directory
RUN mkdir -p /home/developer/.npm-global

# Set up shell environment with npm user prefix
ENV NPM_CONFIG_PREFIX=/home/developer/.npm-global
ENV PATH=$PATH:/home/developer/.npm-global/bin:/usr/local/bin
RUN echo 'export PATH=$PATH:/home/developer/.npm-global/bin:/usr/local/bin' >> ~/.zshrc

# Default command
CMD ["zsh"]