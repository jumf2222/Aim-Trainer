let canvas = document.getElementById("canvas");
let score_label = document.getElementById("score");
let error_label = document.getElementById("error");
let accuracy_label = document.getElementById("accuracy");
let reset_button = document.getElementById("reset");
let tracking_checkbox = document.getElementById("tracking");
let target_count_label = document.getElementById("target_count");
let ctx = canvas.getContext("2d");

const SCREEN_WIDTH = 1920;
const SCREEN_HEIGHT = 1080;
const SCORE_MULTIPLIER = 0.0001;
const TARGET_COUNT = 3;
const FPS_TARGET_TIME = (1 / 60) * 1000; // Miliseconds

class Vector2 {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(a) {
        return new Vector2(this.x + a.x, this.y + a.y);
    }

    dist_sqr(a) {
        return (
            (this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y)
        );
    }
}

class Target {
    radius = Math.random() * 50 + 50;
    velocity = new Vector2(Math.random() * 9 + 1, Math.random() * 9 + 1);
    position = new Vector2(
        Math.random() * (SCREEN_WIDTH - 2 * this.radius) + this.radius,
        Math.random() * (SCREEN_HEIGHT - 2 * this.radius) + this.radius
    );
    static target_img = new Image();

    constructor() {
        Target.target_img.src = "assets/images/target.png";
    }

    update() {
        this.position = this.position.add(this.velocity);

        if (
            this.position.x > SCREEN_WIDTH - this.radius ||
            this.position.x < this.radius
        )
            this.velocity.x = -this.velocity.x;
        if (
            this.position.y > SCREEN_HEIGHT - this.radius ||
            this.position.y < this.radius
        )
            this.velocity.y = -this.velocity.y;
    }

    draw(ctx) {
        ctx.drawImage(
            Target.target_img,
            this.position.x - this.radius,
            this.position.y - this.radius,
            this.radius * 2,
            this.radius * 2
        );
    }
}

let callback_number;
let prev_time = null;

var drag = false;
var mouse_pos = new Vector2(0, 0);
canvas.addEventListener("mousedown", (event) => {
    drag = true;
    const { width, height } = canvas.getBoundingClientRect();
    mouse_pos = new Vector2(
        (event.offsetX / width) * SCREEN_WIDTH,
        (event.offsetY / height) * SCREEN_HEIGHT
    );
});

canvas.addEventListener("mousemove", (event) => {
    if (drag && tracking_mode) {
        const { width, height } = canvas.getBoundingClientRect();
        mouse_pos = new Vector2(
            (event.offsetX / width) * SCREEN_WIDTH,
            (event.offsetY / height) * SCREEN_HEIGHT
        );
    }
});

canvas.addEventListener("mouseup", (event) => {
    drag = false;
});

reset_button.addEventListener("click", (event) => {
    initialize();
});

tracking_checkbox.addEventListener("click", (event) => {
    tracking_mode = tracking_checkbox.checked;
});

let score = 0;
let total_error = 0;
let hit_count = 0;
let miss_count = 0;
let targets_created = 0;
let targets = [];
let tracking_mode = false;

let initialize = () => {
    score = 0;
    total_error = 0;
    hit_count = 0;
    miss_count = 0;
    targets = [];
    targets_created = 0;

    for (let i = 0; i < TARGET_COUNT; i++) {
        targets.push(new Target());
        targets_created++;
    }
};

let callback = (cur_time) => {
    callback_number = requestAnimationFrame(callback);

    if (prev_time == null) {
        prev_time = cur_time;
        return;
    }

    let skipped = 0;
    while (cur_time - prev_time > FPS_TARGET_TIME) {
        prev_time += FPS_TARGET_TIME;
        skipped += 1;

        tick();
    }
};

let tick = () => {
    // Physics
    let hit = false;
    for (let i = 0; i < TARGET_COUNT; i++) {
        let target = targets[i];
        if (drag) {
            let dist = target.position.dist_sqr(mouse_pos);
            if (dist <= target.radius * target.radius) {
                hit = true;
                hit_count += 1;
                total_error += Math.sqrt(dist);
                score +=
                    (target.radius * target.radius - dist) * SCORE_MULTIPLIER;

                if (!tracking_mode) {
                    targets[i] = new Target();
                    targets_created++;
                }
            }
        }
        target.update();
    }

    if (drag && !hit) {
        miss_count += 1;
    }

    if (!tracking_mode) {
        drag = false;
    }

    // Stats
    score_label.textContent = "Score: " + Math.round(score);
    target_count_label.textContent = "Targets: " + targets_created;

    if (hit_count == 0) {
        error_label.textContent = "Avg Error: ?";
    } else {
        error_label.textContent =
            "Avg Error: " + Math.round(total_error / hit_count);
    }

    if (hit_count + miss_count == 0) {
        accuracy_label.textContent = "Accuracy: ?";
    } else {
        accuracy_label.textContent =
            "Accuracy: " +
            Math.round((hit_count / (hit_count + miss_count)) * 100) +
            "%";
    }

    // Update Screen

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    for (let target of targets) {
        target.draw(ctx);
    }
};

initialize();
callback_number = requestAnimationFrame(callback);
