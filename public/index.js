/*
class POImanager
responsible for communication with the server
makes requests to do inferences based on updated parameters and data
*/

class Communicator{
  constructor(url){
    this.url = url
  }
  
  async submitFile(){
    const [file] = document.querySelector("input[type=file]").files;
    
    if(file){
      let inference = ""

      let response = await fetch(
        this.url,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filetype: file.type, 
            trajectory: await this.parse(file)
          })
        }
      )

      inference = await response.json
      updateInference();
      return inference
    }else{
      //TODO: handle no file given
      return
    }

    
  }

  async makeInference(minSamples, eps){
    const response = await fetch(
      this.url+`?min_samples=${minSamples}&eps=${eps}`
    )
    const inferences = await response.json()
    return inferences    
  }
  
  /*
  parses a user defined file and returns it's content as a String
  */
  parse(file) {
    // Always return a Promise
    return new Promise((resolve, reject) => {
      let content = '';
      const reader = new FileReader();
      // Wait till complete
      reader.onloadend = function(e) {
        content = e.target.result;
        const result = content.split(/\r\n|\n/);
        resolve(result);
      };
      // Make sure to handle error states
      reader.onerror = function(e) {
        reject(e);
      };
      reader.readAsText(file);
    });
  }
  
}

/*
class POImanager
responsible for managing and displaying all the POIs that have been inferred
Keeps an internal list of POIS that helps associating the POIs on the map with the POIs on the list
*/
class POImanager{
  constructor(map){
    this.map = map;
    this.pois = [];
    
    //this.mapLayer = L.geoJSON().addTo(map);
    this.mapLayer = L.layerGroup().addTo(map);
    console.log(this.mapLayer)
  }

  displayPois(geoJSONObj){
    //clear previous pois
    this.pois = [];
    //empty out the map layer
    this.mapLayer.clearLayers();

    
    let i = 0;
    for(let feature of geoJSONObj.features){
      let nightness = feature.properties.inferences.find(e => e.type == "nightness");
      let workHours = feature.properties.inferences.find(e => e.type == "workHours9to5");
      let pointCount = feature.properties.inferences.find(e => e.type == "pointCount");

      this.pois.push({
        index: i,
        mapFeature: null,

        coords: feature.properties.coords,
        place: null,
        accuracy: nightness.accuracy,
        nightness: nightness,
        workHours: workHours,
        pointCount: pointCount
      })
      i++
    }

    this.clearPoiList();
    this.addPoisToMap();
    this.addPoisToList();
  }

  clearPoiList(){
    let poiList = document.querySelector(".poiList");
    while (poiList.lastElementChild) {
      poiList.removeChild(poiList.lastElementChild);
    }
  }

  addPoisToList(){
    let poiList = document.querySelector(".poiList");

    for(let poi of this.pois){
      let entry = document.createElement("div");
      entry.classList.add("poiListItem");
      entry.setAttribute("name", `${poi.index}`);

      let poicontent = "";
      poicontent += `<div class="poiWrapper">`

      poicontent += `<div class="removeWrapper"><div class="removeButton" onclick="pois.remove('${poi.index}')">x</div></div>`
      
      poicontent += `<div class="poiContentWrapper">`
      poicontent += `<p><b>cluster size rank: </b>${Math.round(poi.pointCount.confidence * 1000)/10 } %</p>`;
      poicontent += '<p><b>confidences: </b></p>'
      poicontent += `<p>home: ${Math.round(poi.nightness.confidence * 1000)/10 } %</p>`;
      poicontent += `<p>workplace: ${Math.round(poi.workHours.confidence * 1000)/10 } %</p>`;
      poicontent += `</div>`

      poicontent += `</div>`

      entry.innerHTML = poicontent


      //toggle highlight on click
      entry.onclick = ()=>{
        //turn highlight off
        if(entry.classList.contains("selected")){
          entry.classList.remove("selected")
          this.highlight();
          return
        }

        //clear all other poi
        this.highlight();
        //highlight this one
        this.highlight(poi.index);
        return
      } 

      poiList.append(entry);
    }
  }

  /*
  Function to highlight a point both on map and on list
  with no argument given, it will reset all highlighting
  */
  highlight(poiIndex=null){
    if(poiIndex == null){
      this.mapLayer.eachLayer(layer => layer.setOpacity(0.5))
      let listItems = document.querySelectorAll(`.poiListItem`);
      console.log(listItems)
      for (let listItem of listItems){
        console.log(listItem)
        listItem.classList.remove("selected")
      }
      return
    }

    //highlight map marker
    this.pois[poiIndex].mapFeature.setOpacity(1)
    //highlight list item
    let listItem = document.querySelector(`[class="poiListItem"][name="${poiIndex}"]`);
    listItem.classList.add("selected");
    return
  }

  remove(poiIndex){
    //remove map marker
    this.mapLayer.removeLayer(this.pois[poiIndex].mapFeature)
    
    let listItem = document.querySelector(`[name="${poiIndex}"]`);
    listItem.remove()
  }

  //TODO: change so it sources from this.pois 
  addPoisToMap(geoJSONObj){

    for(let poi of this.pois){
      // save referene to marker in poi-list for future reference
      poi.mapFeature = L.marker([poi.coords[1],poi.coords[0]],{opacity:0.5})
      poi.mapFeature.on("click", ()=>{
        //clear all other poi
        this.highlight();
        //highlight this one
        this.highlight(poi.index);
      } 
)

      this.mapLayer.addLayer(poi.mapFeature);

    }
  }
}

async function updateInference(){
  var minSamples = document.querySelector("#minSamples").value;
  var eps = document.querySelector("#epsilon").value;

  let inference = await server.makeInference(minSamples, eps)
  console.log(inference)

  pois.displayPois(inference)
}

const server = new Communicator("/infer")
const reader = new FileReader()
const map = L.map('map').setView([51.963, 7.611], 13);
const pois = new POImanager(map)


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
