/*
const min = { x: 0, y: 0, z: 0 };
const max = { x: 100, y: 100, z: 100 };
const octree = new Octree(min, max);

const object1 = {
  min: { x: 10, y: 10, z: 10 },
  max: { x: 20, y: 20, z: 20 }
};

const object2 = {
  min: { x: 50, y: 50, z: 50 },
  max: { x: 60, y: 60, z: 60 }
};

octree.insert(object1);
octree.insert(object2);
*/


class OctreeNode {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.objects = [];
        this.children = [];
    }
}

export class Octree {
    constructor(min, max, maxDepth = 4, maxObjectsPerNode = 8) {
        this.maxDepth = maxDepth;
        this.maxObjectsPerNode = maxObjectsPerNode;
        this.root = new OctreeNode(min, max);
    }

    insert(object, node = this.root, depth = 0) {
        if (!node) return;

        if (!this.intersects(node, object.min, object.max)) return;

        if (depth < this.maxDepth && node.objects.length >= this.maxObjectsPerNode) {
            if (node.children.length === 0) {
                this.split(node);
            }

            for (let i = 0; i < 8; i++) {
                this.insert(object, node.children[i], depth + 1);
            }
        } else {
            node.objects.push(object);
        }
    }

    intersects(node, min, max) {
        return (
            node.min.x <= max.x &&
            node.max.x >= min.x &&
            node.min.y <= max.y &&
            node.max.y >= min.y &&
            node.min.z <= max.z &&
            node.max.z >= min.z
        );
    }

    split(node) {
        const size = {
            x: (node.max.x - node.min.x) / 2,
            y: (node.max.y - node.min.y) / 2,
            z: (node.max.z - node.min.z) / 2
        };

        for (let i = 0; i < 8; i++) {
            const offsetX = (i & 1) ? size.x : 0;
            const offsetY = (i & 2) ? size.y : 0;
            const offsetZ = (i & 4) ? size.z : 0;

            const min = {
                x: node.min.x + offsetX,
                y: node.min.y + offsetY,
                z: node.min.z + offsetZ
            };

            const max = {
                x: min.x + size.x,
                y: min.y + size.y,
                z: min.z + size.z
            };

            node.children[i] = new OctreeNode(min, max);
        }
    }

    findClosestObject(position, radius, node = this.root, depth = 0) {
        if (!node) {
            console.error('Octree.findClosestObject(): invalid node');
            return null;
        }

        if (!this.intersectsSphere(node, position, radius)) {
            return null;
        }

        let closestObject = null;
        let closestDistanceSq = Infinity;

        for (const object of node.objects) {
            const distanceSq = this.distanceSq(position, object);

            if (distanceSq < radius * radius && distanceSq < closestDistanceSq) {
                closestDistanceSq = distanceSq;
                closestObject = object;
            }
        }

        if (depth < this.maxDepth && node.children.length > 0) {
            for (const child of node.children) {
                const childClosestObject = this.findClosestObject(position, radius, child, depth + 1);

                if (childClosestObject) {
                    const childDistanceSq = this.distanceSq(position, childClosestObject);

                    if (childDistanceSq < closestDistanceSq) {
                        closestDistanceSq = childDistanceSq;
                        closestObject = childClosestObject;
                    }
                }
            }
        }
        return closestObject;
    }

    intersectsSphere(node, position, radius) {
        const rSq = radius * radius;
        let dMin = 0;

        for (const axis of ['x', 'y', 'z']) {
            if (position[axis] < node.min[axis]) {
                const d = position[axis] - node.min[axis];
                dMin += d * d;
            } else if (position[axis] > node.max[axis]) {
                const d = position[axis] - node.max[axis];
                dMin += d * d;
            }
        }
        return dMin <= rSq;
    }

    distanceSq(position, object) {
        const center = {
            x: (object.min.x + object.max.x) / 2,
            y: (object.min.y + object.max.y) / 2,
            z: (object.min.z + object.max.z) / 2
        };

        const dx = position.x - center.x;
        const dy = position.y - center.y;
        const dz = position.z - center.z;

        return dx * dx + dy * dy + dz * dz;
    }

    clear() {
        this.objects = [];
        this.children= [];
    }

    addMesh(mesh) {
        let info = mesh.getBoundingInfo();
        const radius = info.boundingSphere.radius * 2;
        
        const pos = mesh.position;
        const oct_object = {
            min: { x: pos.x-radius, y: pos.y-radius, z: pos.z-radius },
            max: { x: pos.x+radius, y: pos.y+radius, z: pos.z+radius },
        };
        this.insert(oct_object);
    }
}