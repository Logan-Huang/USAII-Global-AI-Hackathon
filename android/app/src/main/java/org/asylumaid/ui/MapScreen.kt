package org.asylumaid.ui

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch
import org.asylumaid.AppConfig
import org.asylumaid.location.LocationProvider
import org.asylumaid.model.Place
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

/**
 * "Help near you" — osmdroid (OpenStreetMap) rendering of community-mapped places fetched
 * from the backend (which preserves the NGO-before-lawyer ranking). Labeled as UNVERIFIED
 * community data; the curated "Find legal help" directory remains the authoritative path.
 */
@Composable
fun MapScreen(app: AppViewModel, onClose: () -> Unit) {
    val context = LocalContext.current
    val uri = LocalUriHandler.current
    val scope = rememberCoroutineScope()

    val places = remember { mutableStateListOf<Place>() }
    var loading by remember { mutableStateOf(false) }
    var loadingText by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<String?>(null) }
    var mapView by remember { mutableStateOf<MapView?>(null) }

    fun setMarkers(list: List<Place>) {
        val mv = mapView ?: return
        mv.overlays.clear()
        for (p in list) {
            mv.overlays.add(Marker(mv).apply {
                position = GeoPoint(p.lat, p.lon)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                title = p.name
            })
        }
        mv.invalidate()
    }

    fun center(lat: Double, lon: Double, zoom: Double) {
        mapView?.controller?.apply { setZoom(zoom); setCenter(GeoPoint(lat, lon)) }
    }

    suspend fun loadPlaces(lat: Double, lon: Double) {
        loading = true; loadingText = app.t("mapSearching"); status = null
        try {
            for ((i, radius) in AppConfig.PLACES_RADII.withIndex()) {
                val list = app.places(lat, lon, radius)
                if (list.isNotEmpty() || i == AppConfig.PLACES_RADII.lastIndex) {
                    places.clear(); places.addAll(list)
                    setMarkers(list)
                    loading = false
                    status = if (list.isEmpty()) app.t("mapEmpty") else null
                    return
                }
                loadingText = app.t("mapExpanding")
            }
        } catch (e: Throwable) {
            loading = false; status = app.t("mapError")
        }
    }

    suspend fun centerByQuery(query: String) {
        loading = true; loadingText = app.t("mapSearching"); status = null
        places.clear()
        try {
            val loc = app.geocode(query)
            center(loc.lat, loc.lon, 12.0)
            loadPlaces(loc.lat, loc.lon)
        } catch (e: Throwable) {
            loading = false; status = app.t("mapError")
        }
    }

    suspend fun useMyLocation() {
        loading = true; loadingText = app.t("mapSearching"); status = null
        val coord = LocationProvider.current(context)
        if (coord == null) { loading = false; status = app.t("mapError"); return }
        center(coord.first, coord.second, 13.0)
        loadPlaces(coord.first, coord.second)
    }

    val permLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) scope.launch { useMyLocation() } else status = app.t("mapError")
    }
    fun requestMyLocation() {
        val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
        if (granted) scope.launch { useMyLocation() }
        else permLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
    }

    // Free osmdroid resources when this screen leaves the composition.
    DisposableEffect(Unit) {
        onDispose { mapView?.onDetach() }
    }

    // Centre on the profile's location once the map is ready.
    LaunchedEffect(mapView) {
        if (mapView != null) {
            val q = app.mapQuery
            if (q.isNotEmpty()) centerByQuery(q)
        }
    }

    Surface(Modifier.fillMaxSize(), color = AA.bg) {
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
            Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(app.t("mapHeading"), color = AA.text, fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                TextButton(onClick = { requestMyLocation() }) {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, tint = AA.primary, modifier = Modifier.height(18.dp))
                    Text(app.t("mapUseMyLocation"), color = AA.primary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
                IconButton(onClick = onClose) {
                    Icon(Icons.Filled.Close, contentDescription = app.t("resourcesClose"), tint = AA.textMuted)
                }
            }

            // Unverified-data note (matches web/iOS).
            Text(
                app.t("mapNote"), color = AA.warningText, fontSize = 12.sp,
                modifier = Modifier.fillMaxWidth().background(AA.warningBg).padding(10.dp),
            )

            Box {
                AndroidView(
                    factory = { ctx ->
                        MapView(ctx).apply {
                            setTileSource(TileSourceFactory.MAPNIK)
                            setMultiTouchControls(true)
                            controller.setZoom(3.0)
                            controller.setCenter(GeoPoint(20.0, 0.0))
                            mapView = this
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(260.dp),
                )
                if (loading) {
                    Column(
                        Modifier.fillMaxWidth().height(260.dp),
                        verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        CircularProgressIndicator(color = AA.primary)
                        Text(loadingText, color = AA.textMuted, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                    }
                }
            }

            status?.let { s ->
                Row(
                    Modifier.fillMaxWidth().background(AA.surface).padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(s, color = AA.textMuted, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    TextButton(onClick = { scope.launch { val q = app.mapQuery; if (q.isNotEmpty()) centerByQuery(q) } }) {
                        Text(app.t("mapRetry"), color = AA.primary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            if (places.isNotEmpty()) {
                Text(
                    app.t("mapListHeading"), color = AA.textMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
                LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                    items(places.size, key = { "${places[it].lat},${places[it].lon},${places[it].name}" }) { idx ->
                        PlaceRow(places[idx], onOpen = { uri.openUri(it) }, onFocus = { center(it.lat, it.lon, 15.0) })
                        Divider(color = AA.borderLight)
                    }
                }
            }
        }
    }
}

@Composable
private fun PlaceRow(place: Place, onOpen: (String) -> Unit, onFocus: (Place) -> Unit) {
    Column(
        Modifier.fillMaxWidth().clickable { onFocus(place) }.padding(vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(place.name, color = AA.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text(
                place.category, color = AA.accentDark, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                modifier = Modifier.background(AA.accentLight, CircleShape).padding(horizontal = 6.dp, vertical = 2.dp),
            )
        }
        if (place.address.isNotEmpty()) Text(place.address, color = AA.textMuted, fontSize = 12.sp)
        if (place.phone.isNotEmpty()) Text(place.phone, color = AA.textMuted, fontSize = 12.sp)
        if (place.website.isNotEmpty()) {
            Text(
                websiteLabel(place.website), color = AA.primary, fontSize = 12.sp,
                modifier = Modifier.clickable { onOpen(place.website) },
            )
        }
    }
}

private fun websiteLabel(s: String): String =
    s.removePrefix("https://").removePrefix("http://").take(40)
