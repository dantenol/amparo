$(document).ready(() => {
  var webComponent = document.querySelector("openvidu-webcomponent");
  var form = document.getElementById("main");

  if (
    webComponent.getAttribute("openvidu-secret") != undefined &&
    webComponent.getAttribute("openvidu-server-url") != undefined
  ) {
    form.style.display = "none";
    webComponent.style.display = "block";
  }

  webComponent.addEventListener("joinSession", event => {});
  webComponent.addEventListener("leaveSession", event => {
    form.style.display = "block";
    webComponent.style.display = "none";
  });
  webComponent.addEventListener("error", event => {
    console.log("Error event", event.detail);
  });
  joinSession();
});

function joinSession() {
  const search = location.search.substring(1);
  const obj = JSON.parse(
    '{"' +
      decodeURI(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"') +
      '"}'
  );
  const sessionName = obj.session;
  console.log(sessionName);
  const user = "ANONIMO";
  const form = document.getElementById("main");
  const webComponent = document.querySelector("openvidu-webcomponent");
  var tokens = [];

  const ovSettings = {
    chat: true,
    autopublish: false,
    avatar: false,
    toolbarButtons: {
      audio: true,
      video: true,
      screenShare: false,
      fullscreen: false,
      exit: true
    }
  };

  form.style.display = "none";
  webComponent.style.display = "block";

  if (
    webComponent.getAttribute("openvidu-secret") != undefined &&
    webComponent.getAttribute("openvidu-server-url") != undefined
  ) {
    location.reload();
  } else {
    getToken(sessionName).then(token1 => {
      tokens.push(token1);
      getToken(sessionName).then(token2 => {
        tokens.push(token2);
        webComponent.sessionConfig = { sessionName, user, tokens, ovSettings };
      });
    });
  }
}

/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
 *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
 *   3) Configure OpenVidu Web Component in your client side with the token
 */

var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "MY_SECRET";

function getToken(sessionName) {
  return createSession(sessionName).then(sessionId => createToken(sessionId));
}

function createSession(sessionName) {
  // See https://openvidu.io/docs/reference-docs/REST-API/#post-apisessions
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: OPENVIDU_SERVER_URL + "/api/sessions",
      data: JSON.stringify({ customSessionId: sessionName }),
      headers: {
        Authorization: "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
        "Content-Type": "application/json"
      },
      success: response => resolve(response.id),
      error: error => {
        if (error.status === 409) {
          resolve(sessionName);
        } else {
          console.warn(
            "No connection to OpenVidu Server. This may be a certificate error at " +
              OPENVIDU_SERVER_URL
          );
          if (
            window.confirm(
              'No connection to OpenVidu Server. This may be a certificate error at "' +
                OPENVIDU_SERVER_URL +
                '"\n\nClick OK to navigate and accept it. ' +
                'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                OPENVIDU_SERVER_URL +
                '"'
            )
          ) {
            location.assign(OPENVIDU_SERVER_URL + "/accept-certificate");
          }
        }
      }
    });
  });
}

function createToken(sessionId) {
  // See https://openvidu.io/docs/reference-docs/REST-API/#post-apitokens
  return new Promise((resolve, reject) => {
    $.ajax({
      type: "POST",
      url: OPENVIDU_SERVER_URL + "/api/tokens",
      data: JSON.stringify({ session: sessionId }),
      headers: {
        Authorization: "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
        "Content-Type": "application/json"
      },
      success: response => resolve(response.token),
      error: error => reject(error)
    });
  });
}
