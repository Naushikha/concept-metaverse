FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY ./start.sh /start.sh
RUN chmod a+x /start.sh

WORKDIR /app

CMD ["/start.sh"]
