"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useT } from "@/components/i18n/useT";
import {
  getWarehouseBinPosition,
  WAREHOUSE_BINS,
  WAREHOUSE_BIN_COLUMNS,
  WAREHOUSE_BIN_ROWS,
} from "@/lib/warehouseLayout";

export type WarehouseBinVisual = {
  code: string;
  itemCount: number;
  lowCount: number;
  quantity: number;
};

type Warehouse3DMapProps = {
  bins: WarehouseBinVisual[];
  heatmapMode: "qty" | "low";
  onSelectBin: (bin: string) => void;
  rackCategories?: Record<string, string>;
  selectedBin: string | null;
};

type CameraTransition = {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  startedAt: number;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
};

type WarehouseView = "PERSPECTIVE" | "TOP";

const EMPTY_COLOR = new THREE.Color("#64748b");
const QUANTITY_COLOR = new THREE.Color("#2563eb");
const LOW_COLOR = new THREE.Color("#f59e0b");
const SELECTED_COLOR = new THREE.Color("#14b8a6");
const HOVER_COLOR = new THREE.Color("#e2e8f0");
const DEFAULT_CAMERA = new THREE.Vector3(16, 14, 19);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.7, 0);

const makeLabel = (
  text: string,
  background = "rgba(8, 17, 31, 0.9)",
  foreground = "#f8fafc",
) => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = background;
  context.beginPath();
  context.roundRect(8, 8, 304, 64, 8);
  context.fill();
  context.strokeStyle = "rgba(148, 163, 184, 0.45)";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = foreground;
  context.font = "600 28px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 160, 41);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
};

const easeInOutCubic = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

export default function Warehouse3DMap({
  bins,
  heatmapMode,
  onSelectBin,
  rackCategories = {},
  selectedBin,
}: Warehouse3DMapProps) {
  const { t } = useT();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const binMeshesRef = useRef(new Map<string, THREE.Mesh>());
  const selectionMarkerRef = useRef<THREE.Group | null>(null);
  const routeLineRef = useRef<THREE.Line | null>(null);
  const cameraTransitionRef = useRef<CameraTransition | null>(null);
  const onSelectRef = useRef(onSelectBin);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [hoveredBin, setHoveredBin] = useState<string | null>(null);
  const [view, setView] = useState<WarehouseView>("PERSPECTIVE");

  const hoveredData = useMemo(
    () => bins.find((bin) => bin.code === hoveredBin) || null,
    [bins, hoveredBin],
  );
  const selectedData = useMemo(
    () => bins.find((bin) => bin.code === selectedBin) || null,
    [bins, selectedBin],
  );
  const selectedPosition = selectedBin
    ? getWarehouseBinPosition(selectedBin)
    : null;

  useEffect(() => {
    onSelectRef.current = onSelectBin;
  }, [onSelectBin]);

  const moveCamera = (position: THREE.Vector3, target: THREE.Vector3) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    cameraTransitionRef.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      startedAt: performance.now(),
      toPosition: position,
      toTarget: target,
    };
  };

  const resetCamera = () => {
    setView("PERSPECTIVE");
    moveCamera(DEFAULT_CAMERA.clone(), DEFAULT_TARGET.clone());
  };

  const changeView = (nextView: WarehouseView) => {
    setView(nextView);
    if (nextView === "TOP") {
      moveCamera(new THREE.Vector3(0, 25, 0.01), new THREE.Vector3(0, 0, 0));
      return;
    }
    moveCamera(DEFAULT_CAMERA.clone(), DEFAULT_TARGET.clone());
  };

  const zoomCamera = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance,
    );
    moveCamera(
      controls.target.clone().add(offset.normalize().multiplyScalar(distance)),
      controls.target.clone(),
    );
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const binMeshes = binMeshesRef.current;
    scene.background = new THREE.Color("#08111f");
    scene.fog = new THREE.FogExp2("#08111f", 0.026);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 120);
    camera.position.copy(DEFAULT_CAMERA);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = "block h-full w-full touch-none";
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 6;
    controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.screenSpacePanning = true;
    controls.target.copy(DEFAULT_TARGET);
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight("#dbeafe", "#0f172a", 1.7));
    const keyLight = new THREE.DirectionalLight("#ffffff", 3.2);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -18;
    keyLight.shadow.camera.right = 18;
    keyLight.shadow.camera.top = 18;
    keyLight.shadow.camera.bottom = -18;
    scene.add(keyLight);

    [-6, 0, 6].forEach((x) => {
      const light = new THREE.PointLight("#bfdbfe", 18, 10, 2);
      light.position.set(x, 6, 0);
      scene.add(light);
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(27, 22),
      new THREE.MeshStandardMaterial({
        color: "#172033",
        metalness: 0.05,
        roughness: 0.88,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(22, 22, "#475569", "#263449");
    grid.position.y = 0.015;
    scene.add(grid);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: "#111827",
      metalness: 0.22,
      roughness: 0.72,
    });
    [
      { size: [27, 3.8, 0.2], position: [0, 1.9, -10.9] },
      { size: [0.2, 3.8, 22], position: [-13.4, 1.9, 0] },
      { size: [0.2, 3.8, 22], position: [13.4, 1.9, 0] },
    ].forEach(({ size, position }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        wallMaterial,
      );
      wall.position.set(position[0], position[1], position[2]);
      wall.receiveShadow = true;
      scene.add(wall);
    });

    const loadingZone = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 2.4),
      new THREE.MeshStandardMaterial({
        color: "#064e3b",
        emissive: "#059669",
        emissiveIntensity: 0.12,
        roughness: 0.82,
      }),
    );
    loadingZone.rotation.x = -Math.PI / 2;
    loadingZone.position.set(0, 0.025, 9.25);
    scene.add(loadingZone);
    const loadingLabel = makeLabel(
      t("app.warehouse.map.scene.loading"),
      "rgba(6, 78, 59, 0.92)",
    );
    if (loadingLabel) {
      loadingLabel.position.set(0, 0.72, 9.2);
      scene.add(loadingLabel);
    }

    const aisleMaterial = new THREE.MeshStandardMaterial({
      color: "#16325c",
      emissive: "#1d4ed8",
      emissiveIntensity: 0.08,
      roughness: 0.78,
    });
    [-5.4, 0, 5.4].forEach((z, index) => {
      const aisle = new THREE.Mesh(
        new THREE.PlaneGeometry(19, 1.2),
        aisleMaterial,
      );
      aisle.rotation.x = -Math.PI / 2;
      aisle.position.set(0, 0.03, z);
      scene.add(aisle);

      const label = makeLabel(`${t("app.warehouse.map.position.aisle")} ${index + 1}`);
      if (label) {
        label.position.set(-10.4, 0.72, z);
        scene.add(label);
      }
    });

    const rackMaterial = new THREE.MeshStandardMaterial({
      color: "#94a3b8",
      metalness: 0.72,
      roughness: 0.3,
    });
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: "#334155",
      metalness: 0.55,
      roughness: 0.45,
    });
    const postGeometry = new THREE.BoxGeometry(0.09, 2.35, 0.09);
    const beamGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.1);
    const shelfGeometry = new THREE.BoxGeometry(1.46, 0.06, 0.92);
    const binGeometry = new THREE.BoxGeometry(1.22, 1.02, 0.76);

    WAREHOUSE_BIN_ROWS.forEach((row) => {
      const firstPosition = getWarehouseBinPosition(`${row}1`);
      if (!firstPosition) return;

      for (let column = 0; column <= WAREHOUSE_BIN_COLUMNS; column += 1) {
        const x =
          (column - WAREHOUSE_BIN_COLUMNS / 2) * 1.55 - 1.55 / 2;
        const post = new THREE.Mesh(postGeometry, rackMaterial);
        post.position.set(x, 1.18, firstPosition.z);
        post.castShadow = true;
        scene.add(post);
      }

      for (let column = 1; column <= WAREHOUSE_BIN_COLUMNS; column += 1) {
        const position = getWarehouseBinPosition(`${row}${column}`);
        if (!position) continue;

        [0.14, 1.48, 2.26].forEach((y) => {
          const beam = new THREE.Mesh(beamGeometry, rackMaterial);
          beam.position.set(position.x, y, position.z);
          beam.castShadow = true;
          scene.add(beam);
        });

        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(position.x, 0.18, position.z);
        shelf.receiveShadow = true;
        scene.add(shelf);

        const material = new THREE.MeshStandardMaterial({
          color: EMPTY_COLOR,
          emissive: "#000000",
          emissiveIntensity: 0,
          metalness: 0.12,
          roughness: 0.5,
        });
        const mesh = new THREE.Mesh(binGeometry, material);
        mesh.position.set(position.x, 0.75, position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.bin = position.bin;

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(binGeometry),
          new THREE.LineBasicMaterial({
            color: "#cbd5e1",
            transparent: true,
            opacity: 0.42,
          }),
        );
        mesh.add(edges);
        scene.add(mesh);
        binMeshes.set(position.bin, mesh);
      }

      const rackCategory = rackCategories[row]?.trim();
      const rackTitle = `${t("app.warehouse.map.position.rack")} ${row}`;
      const rackLabel = makeLabel(
        rackCategory ? `${rackTitle}: ${rackCategory.slice(0, 24)}` : rackTitle,
        rackCategory ? "rgba(20, 83, 45, 0.94)" : "rgba(30, 41, 59, 0.94)",
        rackCategory ? "#dcfce7" : "#f8fafc",
      );
      if (rackLabel) {
        rackLabel.position.set(9.4, 1.9, firstPosition.z);
        scene.add(rackLabel);
      }
    });

    const selectionMarker = new THREE.Group();
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.86, 0.055, 12, 48),
      new THREE.MeshBasicMaterial({ color: SELECTED_COLOR }),
    );
    selectionRing.rotation.x = Math.PI / 2;
    selectionMarker.add(selectionRing);
    const selectionBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.18, 3.2, 18, 1, true),
      new THREE.MeshBasicMaterial({
        color: SELECTED_COLOR,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
      }),
    );
    selectionBeam.position.y = 1.65;
    selectionMarker.add(selectionBeam);
    selectionMarker.visible = false;
    scene.add(selectionMarker);
    selectionMarkerRef.current = selectionMarker;

    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.08, 9),
        new THREE.Vector3(0, 0.08, 9),
      ]),
      new THREE.LineBasicMaterial({
        color: SELECTED_COLOR,
        transparent: true,
        opacity: 0.82,
      }),
    );
    routeLine.visible = false;
    scene.add(routeLine);
    routeLineRef.current = routeLine;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const findBin = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        Array.from(binMeshes.values()),
        false,
      )[0];
      return typeof hit?.object.userData.bin === "string"
        ? hit.object.userData.bin
        : null;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      const bin = findBin(event);
      setHoveredBin((current) => (current === bin ? current : bin));
      renderer.domElement.style.cursor = bin ? "pointer" : "grab";
      if (hoverCardRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        hoverCardRef.current.style.left = `${event.clientX - rect.left + 16}px`;
        hoverCardRef.current.style.top = `${event.clientY - rect.top + 16}px`;
      }
    };
    const onPointerLeave = () => {
      setHoveredBin(null);
      pointerStartRef.current = null;
      renderer.domElement.style.cursor = "grab";
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (
        !start ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
      ) {
        return;
      }
      const bin = findBin(event);
      if (bin) onSelectRef.current(bin);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let animationFrame = 0;
    const animate = (now: number) => {
      const transition = cameraTransitionRef.current;
      if (transition) {
        const progress = Math.min(1, (now - transition.startedAt) / 720);
        const eased = easeInOutCubic(progress);
        camera.position.lerpVectors(
          transition.fromPosition,
          transition.toPosition,
          eased,
        );
        controls.target.lerpVectors(
          transition.fromTarget,
          transition.toTarget,
          eased,
        );
        if (progress >= 1) cameraTransitionRef.current = null;
      }

      if (selectionMarker.visible) {
        const pulse = 1 + Math.sin(now * 0.004) * 0.08;
        selectionMarker.children[0].scale.setScalar(pulse);
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.LineSegments
        ) {
          geometries.add(object.geometry);
          const objectMaterials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          objectMaterials.forEach((material) => materials.add(material));
        }
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          materials.add(object.material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      binMeshes.clear();
      selectionMarkerRef.current = null;
      routeLineRef.current = null;
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [rackCategories, t]);

  useEffect(() => {
    const byCode = new Map(bins.map((bin) => [bin.code, bin]));
    const maxValue = Math.max(
      1,
      ...bins.map((bin) =>
        heatmapMode === "qty" ? bin.quantity : bin.lowCount,
      ),
    );

    binMeshesRef.current.forEach((mesh, code) => {
      const data = byCode.get(code);
      const value =
        heatmapMode === "qty" ? data?.quantity || 0 : data?.lowCount || 0;
      const strength = Math.min(1, value / maxValue);
      const material = mesh.material as THREE.MeshStandardMaterial;
      const target =
        value <= 0
          ? EMPTY_COLOR
          : heatmapMode === "qty"
            ? QUANTITY_COLOR
            : LOW_COLOR;
      material.color.copy(EMPTY_COLOR).lerp(target, 0.28 + strength * 0.72);

      const isSelected = code === selectedBin;
      const isHovered = code === hoveredBin;
      material.emissive.copy(
        isSelected ? SELECTED_COLOR : isHovered ? HOVER_COLOR : target,
      );
      material.emissiveIntensity = isSelected
        ? 0.72
        : isHovered
          ? 0.32
          : data?.lowCount
            ? 0.13
            : 0;
      mesh.scale.setScalar(isSelected ? 1.1 : isHovered ? 1.045 : 1);
    });
  }, [bins, heatmapMode, hoveredBin, selectedBin]);

  useEffect(() => {
    const marker = selectionMarkerRef.current;
    const routeLine = routeLineRef.current;
    if (!marker || !routeLine) return;

    if (!selectedBin) {
      marker.visible = false;
      routeLine.visible = false;
      return;
    }

    const mesh = binMeshesRef.current.get(selectedBin);
    const position = getWarehouseBinPosition(selectedBin);
    if (!mesh || !position) return;

    marker.position.set(mesh.position.x, 0.08, mesh.position.z);
    marker.visible = true;

    const aisleCenter =
      position.z + (position.side === "LEFT" ? 1.15 : -1.15);
    routeLine.geometry.dispose();
    routeLine.geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.08, 9),
      new THREE.Vector3(position.x, 0.08, 9),
      new THREE.Vector3(position.x, 0.08, aisleCenter),
      new THREE.Vector3(position.x, 0.08, position.z),
    ]);
    routeLine.visible = true;

    if (view === "PERSPECTIVE") {
      const target = mesh.position.clone();
      moveCamera(
        target.clone().add(new THREE.Vector3(4.8, 4.2, 5.8)),
        target,
      );
    }
  }, [selectedBin, view]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = selectedBin ? WAREHOUSE_BINS.indexOf(selectedBin) : 0;
    const row = Math.floor(Math.max(0, index) / WAREHOUSE_BIN_COLUMNS);
    const column = Math.max(0, index) % WAREHOUSE_BIN_COLUMNS;
    let nextRow = row;
    let nextColumn = column;

    if (event.key === "ArrowLeft") nextColumn -= 1;
    else if (event.key === "ArrowRight") nextColumn += 1;
    else if (event.key === "ArrowUp") nextRow -= 1;
    else if (event.key === "ArrowDown") nextRow += 1;
    else if (event.key === "Enter" && !selectedBin) {
      onSelectBin(WAREHOUSE_BINS[0]);
      return;
    } else {
      return;
    }

    event.preventDefault();
    nextRow = Math.min(WAREHOUSE_BIN_ROWS.length - 1, Math.max(0, nextRow));
    nextColumn = Math.min(
      WAREHOUSE_BIN_COLUMNS - 1,
      Math.max(0, nextColumn),
    );
    onSelectBin(
      WAREHOUSE_BINS[nextRow * WAREHOUSE_BIN_COLUMNS + nextColumn],
    );
  };

  return (
    <div
      ref={mountRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative h-[clamp(540px,68vh,760px)] min-h-[540px] w-full overflow-hidden bg-[#08111f] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 max-sm:h-[560px] max-sm:min-h-[560px]"
      role="application"
      aria-label={t("app.warehouse.map.scene.aria")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/65 to-transparent p-3 sm:p-4">
        <div className="min-w-0 rounded-md border border-white/15 bg-[#08111f]/82 px-3 py-2 text-white shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-semibold uppercase text-slate-300">
            {t("app.warehouse.map.scene.title")}
          </div>
          {selectedBin && selectedPosition ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-teal-300">
                  {selectedBin}
                </span>
                <span className="text-xs text-slate-300">
                  {t("app.warehouse.map.binDetails.count", {
                    count: selectedData?.itemCount || 0,
                  })}
                </span>
              </div>
              <div className="mt-0.5 max-w-[320px] text-xs text-slate-300">
                {t("app.warehouse.map.position.path", {
                  aisle: selectedPosition.aisle,
                  rack: selectedPosition.rack,
                  bay: String(selectedPosition.bay).padStart(2, "0"),
                  level: selectedPosition.level,
                })}
              </div>
            </>
          ) : (
            <div className="mt-1 text-xs text-slate-300">
              {t("app.warehouse.map.scene.select")}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
          <div className="flex rounded-md border border-white/15 bg-[#08111f]/86 p-1 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => changeView("PERSPECTIVE")}
              className={`h-8 min-w-12 rounded px-2 text-xs font-semibold transition-colors ${
                view === "PERSPECTIVE"
                  ? "bg-white text-slate-950"
                  : "text-slate-200 hover:bg-white/10"
              }`}
              aria-pressed={view === "PERSPECTIVE"}
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => changeView("TOP")}
              className={`h-8 min-w-12 rounded px-2 text-xs font-semibold transition-colors ${
                view === "TOP"
                  ? "bg-white text-slate-950"
                  : "text-slate-200 hover:bg-white/10"
              }`}
              aria-pressed={view === "TOP"}
            >
              {t("app.warehouse.map.scene.top")}
            </button>
          </div>
          <div className="flex overflow-hidden rounded-md border border-white/15 bg-[#08111f]/86 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => zoomCamera(0.8)}
              className="grid h-9 w-9 place-items-center text-lg font-semibold text-white hover:bg-white/10"
              aria-label={t("app.warehouse.map.zoomIn")}
              title={t("app.warehouse.map.zoomIn")}
            >
              +
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="grid h-9 min-w-14 place-items-center border-x border-white/15 px-2 text-[10px] font-semibold uppercase text-white hover:bg-white/10"
              aria-label={t("app.warehouse.map.reset")}
              title={t("app.warehouse.map.reset")}
            >
              {t("app.warehouse.map.reset")}
            </button>
            <button
              type="button"
              onClick={() => zoomCamera(1.2)}
              className="grid h-9 w-9 place-items-center text-lg font-semibold text-white hover:bg-white/10"
              aria-label={t("app.warehouse.map.zoomOut")}
              title={t("app.warehouse.map.zoomOut")}
            >
              -
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-md border border-white/15 bg-[#08111f]/82 px-3 py-2 text-[11px] text-slate-200 shadow-lg backdrop-blur-md sm:bottom-4 sm:left-4">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
        <span>{t("app.warehouse.map.legend.empty")}</span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            heatmapMode === "qty" ? "bg-blue-500" : "bg-amber-500"
          }`}
        />
        <span>
          {heatmapMode === "qty"
            ? t("app.warehouse.map.legend.qty")
            : t("app.warehouse.map.legend.low")}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden h-14 w-14 place-items-center rounded-full border border-white/20 bg-[#08111f]/75 text-xs font-bold text-white shadow-lg backdrop-blur sm:grid">
        <span className="absolute top-1.5 text-[10px] text-teal-300">N</span>
        <span className="mt-2">+</span>
      </div>

      {hoveredBin && hoveredData && (
        <div
          ref={hoverCardRef}
          className="pointer-events-none absolute z-20 hidden max-w-56 rounded-md border border-white/15 bg-[#08111f]/94 px-3 py-2 text-white shadow-xl backdrop-blur sm:block"
        >
          <div className="font-mono text-sm font-bold text-teal-300">
            {hoveredBin}
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {t("app.warehouse.map.scene.hover", {
              items: hoveredData.itemCount,
              quantity: hoveredData.quantity,
            })}
          </div>
        </div>
      )}
    </div>
  );
}
