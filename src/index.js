import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { Router, Route, Switch } from "react-router-dom";
import { SnackbarProvider, useSnackbar } from 'notistack';
import "assets/scss/material-kit-react.scss?v=1.8.0";

// pages for this product
// import Components from "views/Components/Components.js";
// import ProfilePage from "views/ProfilePage/ProfilePage.js";
// import LoginPage from "views/LoginPage/LoginPage.js";

import LandingPage from "LandingPage.js";
import PlaylistsPage from "PlaylistsPage.js";
import FindPage from "FindPage.js";
import JoinPage from "JoinPage.js";
import BeatSaverPage from "BeatSaverPage.js";

import * as model from 'model.js'
window.model = model

var hist = createBrowserHistory();

ReactDOM.render(
  <SnackbarProvider>
    <MakeEnqueueSnackbarGlobal/>
    <Router history={hist}>
      <Switch>
        <Route exact path="/" component={LandingPage} />
        <Route path="/playlists" component={PlaylistsPage} />
        <Route path="/find" component={FindPage}/>
        <Route path="/join/:playlist_id" component={JoinPage} />
        <Route path="/beatsaver" component={BeatSaverPage} />

        {/* <Route path="/profile-page" component={ProfilePage} />
        <Route path="/login-page" component={LoginPage} />
        <Route path="/components" component={Components} /> */}
        <Route component={NotFound} />
      </Switch>
    </Router>
  </SnackbarProvider>,
  document.getElementById("root")
);

function NotFound(){
  return <h1>Page not found</h1>
}

function MakeEnqueueSnackbarGlobal(){
  const { enqueueSnackbar } = useSnackbar();
  window.enqueueSnackbar = enqueueSnackbar
  return null
}