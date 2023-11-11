const TINY = 0.0001;

export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export function randomInt(min, max) {
    // включая границы []
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function addMultipleCoordinates(multiLine, coordinates, origin_point = {x: 0, y: 0}) {
    coordinates.forEach(coordinate => {
        let x = coordinate.x * 100 + origin_point.x * 100;  // Convert to percentage
        let y = coordinate.y * 100 + origin_point.y * 100;
        multiLine.add({ x: x + '%', y: y + '%' });  // Add as string with "%" symbol
    });
}

export function decreaseValueToZero(value, tiny_value, change_value) {
    if (Math.abs(value) > tiny_value) {
        if (value > 0) {
            value -= change_value;
            if (value < 0) {
                value = 0;
            }
        } else {
            value += change_value;
            if (value > 0) {
                value = 0;
            }
        }
    } else {
        value = 0;
    }
    return value;
}

export function polarToCartesian(radius, fi, teta) {
    // angles in radians
    // https://en.wikipedia.org/wiki/Spherical_coordinate_system
    let x = radius * Math.sin(teta) * Math.cos(fi);
    let y = radius * Math.sin(teta) * Math.sin(fi);
    let z = radius * Math.cos(teta);

    return {x: x, y: y, z: z};
}
export function cartesianToPolar(center_pos, pos, radius) {
    // Calculate the Cartesian coordinates relative to the center of the sphere
    let x = pos.x - center_pos.x;
    let y = pos.y - center_pos.y;
    let z = pos.z - center_pos.z;

    // https://en.wikipedia.org/wiki/Spherical_coordinate_system
    let theta = Math.acos(z / radius);
    let phi = Math.atan2(y, x);

    // Return the spherical coordinates as an object
    return {
        radius: radius,
        theta: theta,
        phi: phi
    };
}
/*
// test
let center_pos = {x: 0, y: 0, z: 0};
let test_pos = {x: 1, y: 1, z: 0};
let radius = dist3d(center_pos, test_pos);
let polar = cartesianToPolar(center_pos, test_pos, radius);
console.log('POLAR:', polar);

let cartesian = polarToCartesian(radius, polar.phi, polar.theta);
console.log('CARTESIAN:', cartesian);
*/

export function rotateVector2d(vector, angle) {
    let x = vector.x;
    let y = vector.y;
    let cos_a = Math.cos(angle);
    let sin_a = Math.sin(angle);

    let rotatedX = x * cos_a + y * sin_a;
    let rotatedY = y * cos_a - x * sin_a;

    return { x: rotatedX, y: rotatedY };
}

export function getRandomSpherePos(max_radius) {
    let radius = randomInt(-max_radius, max_radius);
    
    let fi = randomInt(0, 360);
    let teta = randomInt(0, 360);
    
    let pos = polarToCartesian(radius, fi, teta);
    return pos;
}

export function getRandomSphereRadiusPos(radius) {
    let pos = getRandomSpherePos(100);
    let dir = normalize(pos);
    
    pos = mult3d(dir, radius);
    pos = new BABYLON.Vector3(pos.x, pos.y, pos.z);
    return pos;
}

export function spiralPoint(t, r) {
    // Calculate the angle in radians
    //let angle = t * 2 * Math.PI;
    let angle = t;
  
    // Calculate the distance from the center (0, 0) based on the unwinding rate (r)
    let distance = r * t + 0.04;
  
    // Calculate the x and y coordinates of the point
    let x = distance * Math.cos(angle);
    let y = distance * Math.sin(angle);
  
    // Return the point as an object
    return {
        x: x,
        y: y
    };
}

export function normalize(v) {
    let {x, y, z} = v;
    let vlen = Math.sqrt(x*x + y*y + z*z);
    if (vlen > TINY) {
        let ilen = 1.0 / vlen;

        x = x * ilen;
        y = y * ilen;
        z = z * ilen;
    } else {
        x = 0;
        y = 0;
        z = 0;
    }
    return {x: x, y: y, z: z};
}
export function dist3d(v1, v2) {
    let dx = v2.x - v1.x;
    let dy = v2.y - v1.y;
    let dz = v2.z - v1.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}
export function mult3d(dir, v) {
    let x = dir.x * v;
    let y = dir.y * v;
    let z = dir.z * v;
    return {x: x, y: y, z: z};
}
export function add3d(v1, v2) {
    let dx = v2.x + v1.x;
    let dy = v2.y + v1.y;
    let dz = v2.z + v1.z;
    return {x: dx, y: dy, z: dz};
}
export function sub3d(v1, v2) {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;
    let dz = v1.z - v2.z;
    return {x: dx, y: dy, z: dz};
}
export function dotProduct3d(v1, v2) {
    return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
}
export function crossProduct3d(v1, v2) {
    let x = v1.y * v2.z - v1.z * v2.y;
    let y = v1.z * v2.x - v1.x * v2.z;
    let z = v1.x * v2.y - v1.y * v2.x;
    return {x: x, y: y, z: z};
}
export function vectors3dAngle(a, b) {
	// angle between vectors in radians
	const dot = dotProduct3d(a, b);
	const len1= a.length();
	const len2= b.length();
	const angle = Math.acos(dot / (len1 * len2));
	return angle;
}

// line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
// Determine the intersection point of two line segments
// Return FALSE if the lines don't intersect
export function intersectSegments(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false;
    }
    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // Lines are parallel
    if (denominator === 0) {
        return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false;
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);

    return {x: x, y: y};
}

export function getVectorRectangleIntersection(vx, vy, width, height) {
    // returns point of intersection between a rectangle and a ray with start point at (0, 0) and direction (vx, vy)
    // center of rectangle is (0, 0)
    const k = vy / vx;  // TODO: what to do with vx = 0?

    const half_w = width * 0.5;
    const half_h = height* 0.5;

    // find the intersection points between the line and each of the four sides of the rectangle
    const p_right = { x: half_w, y: k * half_w };
    const p_left  = { x:-half_w, y:-k * half_w };

    const p_top = { x: half_h / k, y: half_h };
    const p_bottom = { x: -half_h / k, y: -half_h };

    let points;
    if (vx > 0 && vy > 0) {
        // test top and right
        points = [p_right, p_top];
    } else if (vx < 0 && vy > 0) {
        // top left
        points = [p_left, p_top];
    } else if (vx < 0 && vy < 0) {
        // bottom left
        points = [p_left, p_bottom];
    } else if (vx > 0 && vy < 0) {
        // bottom right
        points = [p_right, p_bottom];
    }
    // check which of the intersection points are inside the rectangle
    points = points.filter( p => p.x >= -half_w && p.x <= half_w && p.y >= -half_h && p.y <= half_h );

    // now in points one or two points (if it is a corner of rectangle) so just get the first
    return points[0];
}

// convert a quaternion to axis angle representation, 
// preserve the axis direction and angle from -PI to +PI
export function quaternionToAxisAngle(q) {
    // returns [dir, angle]
    let dir = {x: 0, y: 0, z: 0};
    let angle = 0;

    let vl = Math.sqrt(q.x*q.x + q.y*q.y + q.z*q.z);
    if (vl > TINY) {
        let ivl = 1.0 / vl;
        dir.x = q.x*ivl;
        dir.y = q.y*ivl;
        dir.z = q.z*ivl;

        if (q.w < 0) {
            angle = 2.0 * Math.atan2(-vl, -q.w); //-PI,0 
        }
        else {
            angle = 2.0 * Math.atan2( vl,  q.w); //0,PI 
        }
    }
    return [dir, angle];
}

export function quaternionFromAxisAngle(dir, angle) {
    let v = normalize(dir);
    let half_angle = angle*0.5;
    let sin_a = Math.sin(half_angle);
    let q = {x: v.x*sin_a, y: v.y*sin_a, z: v.z*sin_a, w: Math.cos(half_angle)};
    return q;
}

export function quaternionNormalise(q) {
    let n = Math.sqrt(q.x*q.x + q.y*q.y + q.z*q.z + q.w*q.w);

    if (n == 0) {
        return {w: 1, x: 0, y: 0, z: 0};
    }
    else {
        return {w: q.w / n, x: q.x / n, y: q.y / n, z: q.z / n};
    }
}

export function quaternionShortestArc(dir1, dir2) {
    let v1 = normalize(dir1);
    let v2 = normalize(dir2);

    let dot = dotProduct3d(v1, v2);
    let vc  = crossProduct3d(v1, v2);
    
    let q = {w: dot, x: vc.x, y: vc.y, z: vc.z};
    q = quaternionNormalise(q);

    q.w = q.w + 1.0;    // reducing angle to halfangle
    
    if (q.w <= TINY) {  // angle close to PI
        if (v1.z*v1.z > v1.x*v1.x) {
            q.x = 0;
            q.y = v1.z;
            q.z = -v1.y;
        } else {
            q.x = v1.y;
            q.y = -v1.x;
            q.z = 0;
        }
    }
    q = quaternionNormalise(q);
    return q;
}

export function quaternionRotateVector(rotation, value) {
    let vector = {x: 0, y: 0, z: 0};
    let num12 = rotation.x + rotation.x;
    let num2  = rotation.y + rotation.y;
    let num   = rotation.z + rotation.z;
    let num11 = rotation.w * num12;
    let num10 = rotation.w * num2;
    let num9  = rotation.w * num;
    let num8  = rotation.x * num12;
    let num7  = rotation.x * num2;
    let num6  = rotation.x * num;
    let num5  = rotation.y * num2;
    let num4  = rotation.y * num;
    let num3  = rotation.z * num;
    let num15 = ((value.x * ((1.0 - num5) - num3)) + (value.y * (num7 - num9))) + (value.z * (num6 + num10));
    let num14 = ((value.x * (num7 + num9)) + (value.y * ((1.0 - num8) - num3))) + (value.z * (num4 - num11));
    let num13 = ((value.x * (num6 - num10)) + (value.y * (num4 + num11))) + (value.z * ((1.0 - num8) - num5));
    vector.x = num15;
    vector.y = num14;
    vector.z = num13;
    return vector;
}

export function quaternionMul(q1, q2) {
    let A = (q1.w + q1.x)*(q2.w + q2.x);
    let B = (q1.z - q1.y)*(q2.y - q2.z);
    let C = (q1.w - q1.x)*(q2.y + q2.z);
    let D = (q1.y + q1.z)*(q2.w - q2.x);
    let E = (q1.x + q1.z)*(q2.x + q2.y);
    let F = (q1.x - q1.z)*(q2.x - q2.y);
    let G = (q1.w + q1.y)*(q2.w - q2.z);
    let H = (q1.w - q1.y)*(q2.w + q2.z);

    return {w: B + (-E - F + G + H)/2,
            x: A - ( E + F + G + H)/2,
            y: C + ( E - F + G - H)/2,
            z: D + ( E - F - G + H)/2};
}