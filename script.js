console.log("let the Music Begin");
//Initialize
let songIndex = 0;
let audioElement = new Audio("Ed-Sheeran.mp3");
let masterPlay = document.getElementById("masterPlay");
let myProgressBar = document.getElementById("myProgressBar");
let gif = document.getElementById("gif");
let masterSongName = document.getElementById("masterSongName");
let songItem = Array.from(document.getElementsByClassName("songItem"));
let songs = [
  {
    songName: "Perfect",
    filepath: "Ed-Sheeran.mp3",
    coverPath: "covers/cover.jpg",
  },
  { songName: "Hymn For The Weekend", coverPath: "covers/hmm.jpeg" },
  {
    songName: "Dancing With Your Ghost",
    filepath: "songs/Dancing With Your Ghost.mp3",
    coverPath: "covers/ghost.jpg",
  },
  {
    songName: "Heat Waves",
    filepath: "songs/Glass Animals - Heat Waves.mp3",
    coverPath: "covers/heatwave.jpg",
  },
  {
    songName: "Happier",
    filepath: "songs/happier.mp3",
    coverPath: "covers/happier.jpeg",
  },
  {
    songName: "Imagine Dragons",
    filepath: "songs/Imagine Dragons.mp3",
    coverPath: "covers/enemy.jpeg",
  },
  {
    songName: "Willow",
    filepath: "songs/willow.mp3",
    coverPath: "covers/willow.jpg",
  },
  {
    songName: "Believer",
    filepath: "songs/Imagine Dragons - Believer.mp3",
    coverPath: "covers/believer.jpg",
  },
];
songItem.forEach((element, i) => {
  console.log(element, i);
  element.getElementsByTagName("img")[0].src = songs[i].coverPath;
  element.getElementsByClassName("songName")[0].innerText = songs[i].songName;
});

// audioElement.play();

//HAndle play/pause click
masterPlay.addEventListener("click", () => {
  if (audioElement.paused || audioElement.currentTime <= 0) {
    audioElement.play();
    masterPlay.classList.remove("fa-play-circle");
    masterPlay.classList.add("fa-pause-circle");
    gif.style.opacity = 1;
  } else {
    audioElement.pause();
    masterPlay.classList.remove("fa-pause-circle");
    masterPlay.classList.add("fa-play-circle");
    gif.style.opacity = 0;
  }
});

//Listen to events
audioElement.addEventListener("timeUpdate", () => {
  // console.log('timeUpdate');
  //update seekbar
  progress = parseInt((audioElement.currentTime / audioElement.duration) * 100);
  // console.log(progress);
  myProgressBar.value = progress;
});

myProgressBar.addEventListener("change", () => {
  audioElement.currentTime =
    (myProgressBar.value * audioElement.duration) / 100;
});

const makeAllPlays = () => {
  Array.from(document.getElementsByClassName("songItemPlay")).forEach(
    (element) => {
      element.classList.remove("fa-pause-circle");
      element.classList.add("fa-play-circle");
    }
  );
};

Array.from(document.getElementsByClassName("songItemPlay")).forEach(
  (element) => {
    element.addEventListener("click", (e) => {
      console.log(e.target);
      makeAllPlays();
      gif.style.opacity = 1;
      songIndex = parseInt(e.target.id);
      e.target.classList.remove("fa-play-circle");
      e.target.classList.remove("fa-pause-circle");
      audioElement.src = `${songIndex + 1}.mp3`;
      masterSongName.innerText = songs[songIndex].songName;
      audioElement.currentTime = 0;
      audioElement.play();
      masterPlay.classList.remove("fa-play-circle");
      masterPlay.classList.add("fa-pause-circle");
    });
  }
);

document.getElementById("next").addEventListener("click", () => {
  if (songIndex >= 9) {
    songIndex == 0;
  } else {
    songIndex += 1;
  }
  audioElement.src = `${songIndex + 1}.mp3`;
  masterSongName.innerText = songs[songIndex].songName;
  audioElement.currentTime = 0;
  audioElement.play();
  masterPlay.classList.remove("fa-play-circle");
  masterPlay.classList.add("fa-pause-circle");
});

document.getElementById("previous").addEventListener("click", () => {
  if (songIndex <= 0) {
    songIndex == 0;
  } else {
    songIndex -= 1;
  }
  audioElement.src = `${songIndex + 1}.mp3`;
  masterSongName.innerText = songs[songIndex].songName;
  audioElement.currentTime = 0;
  audioElement.play();
  masterPlay.classList.remove("fa-play-circle");
  masterPlay.classList.add("fa-pause-circle");
});
