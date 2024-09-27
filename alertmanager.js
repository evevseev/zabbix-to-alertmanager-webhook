/* global Zabbix, value, CurlHttpRequest */

function formatDate(date) {
  date = date.split(" ");
  var datePart = date[0].split(".");
  var timePart = date[1].split(":");
  return (
    datePart[0] +
    "-" +
    datePart[1] +
    "-" +
    datePart[2] +
    "T" +
    timePart[0] +
    ":" +
    timePart[1] +
    ":" +
    timePart[2] +
    "Z"
  );
}

var allowedSeverities = ["info", "warning", "critical", "blocker"];
function mapSeverity(severity) {
  switch (severity) {
    case "0":
      return "warning";
    case "1":
      return "info";
    case "2":
      return "warning";
    case "3":
      return "warning";
    case "4":
      return "critical";
    case "5":
      return "blocker";
    default:
      throw "Unknown severity: " + severity;
  }
}

try {
  Zabbix.Log(4, "[ Alertmanager webhook ] Started with params: " + value);
  var params = JSON.parse(value);
  var req = new CurlHttpRequest();
  var fields = {};
  var resp;

  if (params.HTTPProxy) {
    req.setProxy(params.HTTPProxy);
  }

  req.AddHeader("Content-Type: application/json");

  var labels = {};
  var annotations = {};
  for (var key in params) {
    if (key.startsWith("annotation_")) {
      annotations[key.substring(11)] = params[key];
    }
    if (key.startsWith("label_")) {
      var keyName = key.substring(6);
      var labelValue = params[key];
      if (keyName === "severity") {
        var ind = allowedSeverities.indexOf(labelValue);
        if (ind > -1) {
          labelValue = allowedSeverities[ind];
        } else {
          labelValue = mapSeverity(labelValue);
        }
      }
      labels[keyName] = labelValue;
    }
  }

  fields.startsAt = formatDate(params.starts_at);
  fields.endsAt = null;
  fields.generatorURL = params.generator_url;

  fields.annotations = annotations;
  fields.labels = labels;

  req.Post(params.URL + "/api/v2/alerts", JSON.stringify([fields]));

  if (resp.Status() != 200) {
    throw "Response code: " + req.Status();
  }
  return "OK";
} catch (error) {
  Zabbix.Log(
    4,
    "[ Alertmanager webhook ] Issue creation failed json : " +
      JSON.stringify([fields])
  );
  Zabbix.Log(3, "[ Alertmanager webhook ] issue creation failed : " + error);
  throw "Failed with error: " + error + ". Json: " + JSON.stringify([fields]);
}
