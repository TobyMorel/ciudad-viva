#![no_std]

use core::panic::PanicInfo;
use core::ptr;

const MAX_NODES: usize = 16_384;
const START: u32 = 1;
const GOAL: u32 = 2;
const EPSILON: f64 = 1.0e-9;

#[repr(C)]
#[derive(Clone, Copy)]
pub struct RouteNode {
    x: i32,
    y: i32,
    neighbors: [i32; 4],
    weights: [f32; 4],
    flags: u32,
}

const EMPTY_NODE: RouteNode = RouteNode {
    x: 0,
    y: 0,
    neighbors: [-1; 4],
    weights: [0.0; 4],
    flags: 0,
};

static mut NODES: [RouteNode; MAX_NODES] = [EMPTY_NODE; MAX_NODES];
static mut DISTANCE: [f64; MAX_NODES] = [f64::INFINITY; MAX_NODES];
static mut PREVIOUS: [i32; MAX_NODES] = [-1; MAX_NODES];
static mut HEAP: [u32; MAX_NODES] = [0; MAX_NODES];
static mut HEAP_POSITION: [i32; MAX_NODES] = [-1; MAX_NODES];
static mut RESULT: [i32; MAX_NODES] = [-1; MAX_NODES];
static mut HEAP_LENGTH: usize = 0;

#[no_mangle]
pub extern "C" fn cv_route_capacity() -> u32 {
    MAX_NODES as u32
}

#[no_mangle]
pub extern "C" fn cv_route_node_size() -> u32 {
    core::mem::size_of::<RouteNode>() as u32
}

#[no_mangle]
pub extern "C" fn cv_route_nodes_ptr() -> u32 {
    ptr::addr_of_mut!(NODES).cast::<RouteNode>() as u32
}

#[no_mangle]
pub extern "C" fn cv_route_result_ptr() -> u32 {
    ptr::addr_of_mut!(RESULT).cast::<i32>() as u32
}

unsafe fn node_less(left: u32, right: u32) -> bool {
    let distance = ptr::addr_of!(DISTANCE).cast::<f64>();
    let a = *distance.add(left as usize);
    let b = *distance.add(right as usize);
    if (a - b).abs() > EPSILON {
        return a < b;
    }
    let nodes = ptr::addr_of!(NODES).cast::<RouteNode>();
    let a = &*nodes.add(left as usize);
    let b = &*nodes.add(right as usize);
    a.x < b.x || (a.x == b.x && a.y < b.y)
}

unsafe fn heap_swap(a: usize, b: usize) {
    let heap = ptr::addr_of_mut!(HEAP).cast::<u32>();
    let positions = ptr::addr_of_mut!(HEAP_POSITION).cast::<i32>();
    ptr::swap(heap.add(a), heap.add(b));
    *positions.add(*heap.add(a) as usize) = a as i32;
    *positions.add(*heap.add(b) as usize) = b as i32;
}

unsafe fn sift_up(mut position: usize) {
    let heap = ptr::addr_of!(HEAP).cast::<u32>();
    while position > 0 {
        let parent = (position - 1) / 2;
        if !node_less(*heap.add(position), *heap.add(parent)) {
            break;
        }
        heap_swap(position, parent);
        position = parent;
    }
}

unsafe fn sift_down(mut position: usize, length: usize) {
    let heap = ptr::addr_of!(HEAP).cast::<u32>();
    loop {
        let mut child = position * 2 + 1;
        if child >= length {
            break;
        }
        if child + 1 < length && node_less(*heap.add(child + 1), *heap.add(child)) {
            child += 1;
        }
        if !node_less(*heap.add(child), *heap.add(position)) {
            break;
        }
        heap_swap(position, child);
        position = child;
    }
}

unsafe fn heap_insert(node: u32) {
    let length = ptr::addr_of_mut!(HEAP_LENGTH);
    let heap = ptr::addr_of_mut!(HEAP).cast::<u32>();
    let positions = ptr::addr_of_mut!(HEAP_POSITION).cast::<i32>();
    let position = *length;
    if position >= MAX_NODES {
        return;
    }
    *heap.add(position) = node;
    *positions.add(node as usize) = position as i32;
    *length += 1;
    sift_up(position);
}

unsafe fn heap_pop() -> u32 {
    let length = ptr::addr_of_mut!(HEAP_LENGTH);
    let heap = ptr::addr_of_mut!(HEAP).cast::<u32>();
    let positions = ptr::addr_of_mut!(HEAP_POSITION).cast::<i32>();
    let root = *heap;
    *length -= 1;
    let remaining = *length;
    if remaining > 0 {
        *heap = *heap.add(remaining);
        *positions.add(*heap as usize) = 0;
        sift_down(0, remaining);
    }
    *positions.add(root as usize) = -2;
    root
}

/// Solves a weighted four-neighbour road graph with an indexed binary heap.
/// Returns the number of path nodes, 0 when unreachable, and -1 for invalid input.
#[no_mangle]
pub extern "C" fn cv_route_solve(node_count: u32) -> i32 {
    let count = node_count as usize;
    if count == 0 || count > MAX_NODES {
        return -1;
    }

    unsafe {
        let distance = ptr::addr_of_mut!(DISTANCE).cast::<f64>();
        let previous = ptr::addr_of_mut!(PREVIOUS).cast::<i32>();
        let positions = ptr::addr_of_mut!(HEAP_POSITION).cast::<i32>();
        let nodes = ptr::addr_of!(NODES).cast::<RouteNode>();
        for index in 0..count {
            *distance.add(index) = f64::INFINITY;
            *previous.add(index) = -1;
            *positions.add(index) = -1;
        }
        *ptr::addr_of_mut!(HEAP_LENGTH) = 0;

        for index in 0..count {
            if (*nodes.add(index)).flags & START != 0 {
                *distance.add(index) = 0.0;
                heap_insert(index as u32);
            }
        }

        if *ptr::addr_of!(HEAP_LENGTH) == 0 {
            return -1;
        }

        let mut target = -1i32;
        while *ptr::addr_of!(HEAP_LENGTH) > 0 {
            let current = heap_pop();
            let current_node = &*nodes.add(current as usize);
            if current_node.flags & GOAL != 0 {
                target = current as i32;
                break;
            }
            let current_distance = *distance.add(current as usize);
            for edge in 0..4 {
                let next = current_node.neighbors[edge];
                if next < 0 || next as usize >= count {
                    continue;
                }
                let next = next as usize;
                let weight = current_node.weights[edge] as f64;
                if !weight.is_finite() || weight < 0.0 {
                    continue;
                }
                let candidate = current_distance + weight;
                if candidate + EPSILON < *distance.add(next) {
                    *distance.add(next) = candidate;
                    *previous.add(next) = current as i32;
                    let position = *positions.add(next);
                    if position == -1 {
                        heap_insert(next as u32);
                    } else if position >= 0 {
                        sift_up(position as usize);
                    }
                }
            }
        }

        if target < 0 {
            return 0;
        }

        let result = ptr::addr_of_mut!(RESULT).cast::<i32>();
        let mut length = 0usize;
        let mut current = target;
        while current >= 0 && length < count {
            *result.add(length) = current;
            length += 1;
            current = *previous.add(current as usize);
        }
        for index in 0..length / 2 {
            ptr::swap(result.add(index), result.add(length - 1 - index));
        }
        length as i32
    }
}

#[panic_handler]
fn panic(_: &PanicInfo) -> ! {
    loop {}
}
