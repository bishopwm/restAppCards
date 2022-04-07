# Miro REST App Cards
This sample app demonstrates the use of the Miro REST API's [App Card endpoints](https://beta.developers.miro.com/docs/app-card). It makes use of each of the available CRUD (create, read, update, delete) methods to add and manage App Cards on a Miro board. This sample app also provides one possible application of creating Miro App Cards from structured data (.CSV file).

Miro capabilities covered in this sample app:
- [x] Miro App Card items
- [x] Create App Card API, GET App Card API, Update App Card API, DELETE App Card API
- [x] Import structured data into Miro
- [x] Miro Live Embed

## Prerequisites:
- Create an [app in Miro](https://miro.com/app/settings/user-profile/apps)
- Generate an OAuth access_token (see [Quickstart Guide](https://beta.developers.miro.com/docs/build-your-first-hello-world-app-1)) for authorization of our REST API **or** leverage our [OAuth 2.0 NodeJS sample app](https://github.com/miroapp/app-examples/tree/beta/examples/oauth/node) and include it in your project.

## Dependencies:
- NodeJS
- HandlebarsJS
- ExpressJS
- Axios
- Fast-CSV

## How to start:

- Clone or download repo
- cd to root folder
- Run `npm install` to install dependencies
- Create a `.env` file in the root folder, and set the following variables:

```
boardId={MIRO_BOARD_ID}
oauthToken={MIRO_ACCESS_TOKEN}
```

- From your desired Miro board, grab the board ID from the URL and paste it into the `.env` `boardId` variable (above)

In this example, we will host the project locally at `PORT 8000`.

## How to run the project
- Run `nodemon app.js` to run the project
- Your express server console should reflect "The web server has started on port 8000" (or the port of your choice)
  
## Folder structure

```
.
├── package.json <-- The app dependencies which are installed in "How to start"
└── app.js <-- The main Node.js script to run the Express server and render our Handlebars app
└── .env <-- File where you are storing your sensitive credentials
└── node_modules <-- Node modules that are installed based on dependencies
└── views
      └── createCard.hbs <-- Handlebars file to render app card creation page
      └── deleteCard.hbs <-- Handlebars file to render app card deletion page
      └── updateCard.hbs <-- Handlebars file to render app card update page
      └── uploadCard.hbs <-- Handlebars file to render app card upload page
      └── viewCard.hbs <-- Handebars file to render app card list page
      └── home.hbs <-- main Handlebars file to render universal/root rendering
      └── layouts
            └── main.hbs <-- the Handlebars app itself
```

### About the app
